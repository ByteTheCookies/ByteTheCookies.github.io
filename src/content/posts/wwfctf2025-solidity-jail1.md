---
title: WWWFctf2025 | Solidity Jail 1
published: 2025-08-25
description: Bash Jail? Boring. PyJail? Too Common. Introducing for the first time, Solidity Jail! Make a contract to read the flag!
image: ''
tags: ["blockchain"]
authors: ["galaxea"]
solves: 10
points: 460
firstblood: false
category: WWWFctf2025
draft: false

---




## Introduction

Jail challenges are always a thrill. You’re thrown into a restricted environment with a single mission: escape and claim the flag. While bash, Python, and even NodeJS jails are familiar territory, running into one in Solidity is a rare treat.

In this challenge, we interacted with a remote server that executed Solidity function code we submitted. The goal? Extract a flag from another contract on the same blockchain. But there was a twist: a blacklist carefully crafted to block obvious approaches.

Navigating this puzzle felt like exploring the EVM itself. Dead ends and misleading paths were everywhere. Yet the final solution emerged smoothly, clever in its simplicity, proving that even the trickiest Solidity jail can be cracked with the right insight.

## Analysis of the challange

First off, let’s scope out the setup. We were provided with two key files:

- **Jail.sol**: The target contract, named in the solidity as *BytecodeRunner*, which features a public variable called `flag` and a `run()` function.

```javascript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BytecodeRunner {

    string public flag = "wwf{REDACTED}";

    function run(bytes memory _bytecode, bytes32 _salt) public
    returns (bool success, bytes memory result)
    {
        address newContract;
        assembly {
            newContract := create2(
                0,
                add(_bytecode, 0x20),
                mload(_bytecode),
                _salt
            )
            if iszero(newContract) {
                revert(0, 0)
            }
        }

        bytes memory callData = abi.encodeWithSelector(
            bytes4(keccak256("main()"))
        );

        (success, result) = newContract.call(callData);
        require(success, "Execution of main() failed.");
    }
}
```

As you can see, the `run()` function takes our bytecode, deploys it using create2, and then calls our main() function.

- **jailTalk.py**: The server-side helper. It wraps whatever we submit inside a Solution contract, compiles it, and sends the resulting bytecode to the run function of *BytecodeRunner*.

```python

#!/usr/local/bin/python
import signal
from solcx import compile_standard
import os
from web3 import Web3
import string
import requests
from urllib.parse import urlparse

contr_add = os.environ.get("CONTRACT_ADDDR")
rpc_url = os.environ.get("RPC_URL")

try:
    parsed = urlparse(rpc_url)
    resp = requests.get(f"{parsed.scheme}://{parsed.netloc}")
    if resp.text != "ok":
        print("Contact admins challenge not working...")
        exit()
except Exception as e:
    print("Contact admins challenge not working...")
    exit()


print("Enter the body of main() (end with three blank lines):")
lines = []
empty_count = 0
while True:
    try:
        line = input()
    except EOFError:
        break
    if line.strip() == "":
        empty_count += 1
    else:
        empty_count = 0
    if empty_count >= 3:
        lines = lines[:-2]
        break
    lines.append(line)

body = "\n".join(f"        {l}" for l in lines)

if not all(ch in string.printable for ch in body):
    raise ValueError("Non-printable characters detected in contract.")

blacklist = [
    "flag",
    "transfer",
    "address",
    "this",
    "block",
    "tx",
    "origin",
    "gas",
    "fallback",
    "receive",
    "selfdestruct",
    "suicide"
]
if any(banned in body for banned in blacklist):
    raise ValueError(f"Blacklisted string found in contract.")


source = f"""// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Solution {{
    function main() external returns (string memory) {{
{body}
    }}
}}
"""

print("Final contract with inserted main() body:")
print(source)

compiled = compile_standard(
    {
        "language": "Solidity",
        "sources": {"Solution.sol": {"content": source}},
        "settings": {
            "outputSelection": {
                "*": {
                    "*": ["evm.bytecode.object"]
                }
            }
        },
    },
    solc_version="0.8.20",
)


bytecode_hex = "0x" + compiled["contracts"]["Solution.sol"]["Solution"]["evm"]["bytecode"]["object"]
salt_hex = "0x" + os.urandom(32).hex()

web3 = Web3(Web3.HTTPProvider(rpc_url))

contr_abi = [{"inputs":[],"name":"flag","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"_bytecode","type":"bytes"},{"internalType":"bytes32","name":"_salt","type":"bytes32"}],"name":"run","outputs":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"result","type":"bytes"}],"stateMutability":"nonpayable","type":"function"}]
contr = web3.eth.contract(address=contr_add, abi=contr_abi)

bytecode_bytes = Web3.to_bytes(hexstr=bytecode_hex)
salt_bytes = Web3.to_bytes(hexstr=salt_hex)
print(contr.functions.run(bytecode_bytes, salt_bytes).call())

```

Here, the most crucial part is obv the blacklist.

---

This blacklist effectively blocks the most straightforward exploits:

- **flag**: Directly calling `target.flag()` is prohibited.
- **address**: We cannot declare an `address` variable to hold the target contract's location.
- **gas**: Access to the `gas()` opcode is restricted, which is often needed for low-level calls.
- **this**: Retrieving our own contract's address is also disallowed.

The goal is clear: invoke the `flag()` function on the `BytecodeRunner` contract.  
Since `main()` is executed by `BytecodeRunner`, the contract's address is simply `msg.sender`.  
The challenge comes down to circumventing these blacklist limitations basically.

## My Solve

Looking at other write-ups for this challenge, it’s clear that there were a variety of approaches to solving it. Some solutions focused heavily on the Python side, manipulating the server-side logic (like sub-stringing the "flag" keyword), while others leaned more on Solidity, crafting intricate contracts to bypass restrictions (like the definition of an interface with the same function name and type signature, then cast the contract’s address to that interface). In my case, I believe I tackled the challenge using the simplest and most straightforward method possible. In fact:

I executed the function via a low-level call, specifically using the `.call()` method on an address and supplying the calldata manually. But how can you calculate a calldata?  

There are multiple techniques to construct the calldata in Solidity for a function invocation. Common methods include:

- `abi.encodeWithSignature("functionName(types...)")`  
- `abi.encodeCall(ContractName.functionName, (args...))`  
- `abi.encodeWithSelector(bytes4Selector, (args...))`  

The first two methods rely on providing the function name as a string, which is explicitly blacklisted, so we can't use them. Therefore, using the last one: `abi.encodeWithSelector`, it allows us to bypass this restriction using a *function selector*.  

A *function selector* is derived as the first 4 bytes of the Keccak-256 hash of its canonical signature -> $ \text{bytes4}(\text{keccak256}("functionName(inputTypes)")) $. In our case flag() has no input types, so it will be empty.


The selector for `flag()` is `0x890eba68`. I used Foundry’s `cast sig` command to compute this easily.  

We also need to bypass the restriction on using the `address` keyword. Because the `main()` function is executed by the target contract itself, its address is inherently available via `msg.sender`. This removes the necessity of defining a separate `address` variable. By combining the appropriate function selector with `msg.sender` as the destination, a conventional low-level `.call()` invocation suffices to execute the target function, thereby resolving the challenge.


**The Payload:**
```
(bool ok, bytes memory res) = msg.sender.staticcall(
    abi.encodeWithSelector(0x890eba68)
);
require(ok, "failed");
return string(res);
```

flag: :spoiler[wwf{y0u_4r3_7h3_7ru3_m4573r_0f_s0l1d17y}]
