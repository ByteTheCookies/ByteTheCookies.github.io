+++
title = 'Confusion'
date = 2025-03-12T22:04:00+01:00
tags = [
  "crypto",
  "Zaua"
]
draft = true
+++

# Confusion
Looks like our cryptographers had one too many glasses of mirto! Can you sober up their sloppy AES scheme, or will the confusion keep you spinning?

## Introduction

Confusion was a crypto CTF from [Srdnlen CTF 2025](https://ctftime.org/event/2576).

```python
#!/usr/bin/env python3

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import os

# Local imports
FLAG = os.getenv("FLAG", "srdnlen{REDACTED}").encode()

# Server encryption function
def encrypt(msg, key):
    pad_msg = pad(msg, 16)
    blocks = [os.urandom(16)] + [pad_msg[i:i + 16] for i in range(0, len(pad_msg), 16)]

    b = [blocks[0]]
    for i in range(len(blocks) - 1):
        tmp = AES.new(key, AES.MODE_ECB).encrypt(blocks[i + 1])
        b += [bytes(j ^ k for j, k in zip(tmp, blocks[i]))]

    c = [blocks[0]]
    for i in range(len(blocks) - 1):
        c += [AES.new(key, AES.MODE_ECB).decrypt(b[i + 1])]

    ct = [blocks[0]]
    for i in range(len(blocks) - 1):
        tmp = AES.new(key, AES.MODE_ECB).encrypt(c[i + 1])
        ct += [bytes(j ^ k for j, k in zip(tmp, c[i]))]

    return b"".join(ct)


KEY = os.urandom(32)

print("Let's try to make it confusing")
flag = encrypt(FLAG, KEY).hex()
print(f"|\n|    flag = {flag}")

while True:
    print("|\n|  ~ Want to encrypt something?")
    msg = bytes.fromhex(input("|\n|    > (hex) "))

    plaintext = pad(msg + FLAG, 16)
    ciphertext = encrypt(plaintext, KEY)

    print("|\n|  ~ Here is your encryption:")
    print(f"|\n|   {ciphertext.hex()}")
```
The challenge acts as an encryption oracle in 3 steps:
1. $\quad b_0 \coloneqq R \\\quad b_i \coloneqq E(m_i) \oplus m_{i-1} \quad i \ge 1$
2. $\quad c_0 \coloneqq R \\\quad c_i \coloneqq D(b_i) \quad i \ge 1$
3. $\quad ct_0 \coloneqq R \\\quad ct_i \coloneqq E(c_i) \oplus c_{i-1} \quad i \ge 1$

Where $m$ is our input message, padded, split into blocks and prefixed with the random block $R$, meanwhile $D$ and $E$ are AES decryption and encryption.
Notice how $ct_i = b_i \oplus c_{i-1}$ since $E(c_i) = E(D(b_i)) = b_i$.

## Solution
Encryption utlity function:
```python
# encrypt and return the nth block
def encrypt(r, msg: bytes, block: int = -1):
    r.sendlineafter(b'x) ', msg.hex().encode())
    r.recvuntil(b'n:\n|\n|   ')
    ct = bytes.fromhex(r.recvline().rstrip().decode())
    if 0 <= block < len(ct) // 16:
        return ct[16*block:16*(block + 1)]
    return ct
```
Since the flag is appended to the end of our input, we can recover the first block with a simple chosen-prefix ECB attack, which I'm doing using my library [cryptils](https://github.com/vympel7/cryptils).
With `dec0` we can calculate a decryption of a 16 long bytestring of zeros, which I'll use to recover the rest of the flag:
```python
def dec0(r):
    msg1 = os.urandom(16)
    enc_msg1 = encrypt(r, msg1, 1)
    msg2 = os.urandom(16)
    enc_msg2 = encrypt(r, msg2, 1)
    val = xor(enc_msg2, msg1)

    ct3 = encrypt(r, enc_msg1 + msg1 + msg2, 3)

    return xor(ct3, val)
```
Also notice how the second block the oracle gives us is a plain encryption of the first block of input.

Let's call the output of `dec0` simply $D(0)$ and set $F_i$ to be the $i$th block of the flag, with $F_0$ being the random block at the start, we can write each block of the flag's ciphertext we received at the start as:
$C_i \coloneqq E(F_i) \oplus F_{i-1} \oplus D(E(F_{i-1}) \oplus F_{i-2})$

Let's take a look at the fourth block after asking the oracle to encrypt $\ F_0 \mid F_1 \mid D(0)$:
$ct_3 = b_3 \oplus D(b_2) =E(D(0)) \oplus F_1 \oplus D(E(F_1) \oplus F_0) = F_1 \oplus D(E(F_1) \oplus F_0)$
$T \coloneqq ct_3 \oplus C_2 = F_1 \oplus D(E(F_1) \oplus F_0) \oplus E(F_2) \oplus F_1 \oplus D(E(F_1) \oplus F_0) = E(F_2)$

Let's then generate a random block $V$ and ask for the encryption of $\ T \mid D(0) \mid V$:
$ct_3 = b_3 \oplus D(b_2) = E(V) \oplus D(0) \oplus D(E(D(0)) \oplus T) = E(V) \oplus D(0) \oplus D(T) = E(V) \oplus D(0) \oplus D(F_2) = E(V) \oplus D(0) \oplus F_2$

We know both $E(V)$ and $D(0)$ and can therefore recover $F_2$. The process can then be repeated for successive blocks:
```python
def main():
    r = remote('confusion.challs.srdnlen.it', 1338) if args.REMOTE else process('./chall.py')

    r.recvuntil(b' = ')
    ct_flag = blockify(bytes.fromhex(r.recvline().rstrip().decode()))

    D0 = dec0(r)

    flag = chosen_prefix(lambda b: encrypt(r, b, 1), string.printable, length=16)
    curr, prev = flag, ct_flag[0]

    for i in range(2, len(ct_flag)):
        ct3 = encrypt(r, prev + curr + D0, 3)
        enc_next = xor(ct_flag[i], ct3)

        msg = os.urandom(16)
        enc_msg = encrypt(r, msg, 1)
        enc = encrypt(r, enc_next + D0 + msg, 3)

        prev = curr
        curr = xor(enc, xor(enc_msg, D0))

        flag += curr

    print('flag:', unpad(flag, 16).decode())

    r.close()
```
```
flag: CSCTF{I_h0p3_th15_Gl4ss_0f_M1rt0_w4rm3d_y0u_3n0ugh}
```
<p align="right">Author: vympel</p>
