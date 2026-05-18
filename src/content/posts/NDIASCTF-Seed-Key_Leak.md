---
title: NDIAS NDIAS Automotive/IoT CTF | Seed-Key Leak
published: 2026-05-18
description: A dealer tool has been leaked dealer_unlock.pyc SecurityAccess guards the ECU's secrets. Break in and read the flag.
image: ''
tags: ["can"]
authors: ["shackwove"]
solves: 96
points: 100
category: NDIASAutomotive/IoTCTF
firstblood: false
draft: false
lang: en
---


## Introduction
A dealer tool has been leaked: dealer_unlock.pyc
SecurityAccess guards the ECU's secrets. Break in and read the flag.

Connection: ./connect.sh 20.18.209.122 13337
Diagnostic CAN IDs: tester 0x7E0 ↔ ECU 0x7E8

> Note: This challenge requires a Linux environment with SocketCAN support. Please run the connection script on a Linux system where the vcan0 interface can be created.
Sessions are terminated after 5 minutes, and reconnected automatically.


## My first CAN challenge
This is my first challenge with the CAN bus or automotive security. So please feel free to contact me if I’ve written anything that’s incorrect or unclear.

## Info Gathering
The file `./connect.sh` create a container to run this challenge. After the container is ready, it shows a banner with information about command we can use:
```bash
=== NDIAS Automotive/IoT CTF Player ===
  candump vcan0                          # watch CAN traffic
  isotprecv -s <SRC> -d <DST> vcan0 &    # ISO-TP receiver
  printf <HEX> | isotpsend -s <SRC> -d <DST> vcan0   # ISO-TP send
  python3 -m caringcaribou --help        # UDS scanner (install: pip3 install git+https://github.com/CaringCaribou/caringcaribou.git)
=======================================
```

Each command has an explanation of its purpose. Let's start to use `candump vcan0`.
> Note: vcan0 is a virtual interface which is userful to communicate with the service.

The output:
```bash
root@9cd4b4f4f139:/# candump -a -l vcan0 
Disabled standard output while logging.
Enabling Logfile 'candump-2026-05-16_072201.log'

```

We use `-l` flag to save candump's output in a log file and filter its result:

```bash
root@9cd4b4f4f139:/# cat candump.log | grep -oP '.{3}#' | sort | uniq -c | sort -nr
     86 0C0#
     17 0D0#
      9 180#
      4 321#
      3 3B0#
      2 600#
      2 4F0#

root@9cd4b4f4f139:/# cat candump.log | grep "4F0"
(1778916121.704777) vcan0 4F0#0300000000000000
(1778916126.793852) vcan0 4F0#0300000000000000
root@9cd4b4f4f139:/# cat candump.log | grep "600"
(1778916121.705025) vcan0 600#4E44494153000000
(1778916126.794075) vcan0 600#4E44494153000000
root@9cd4b4f4f139:/# cat candump.log | grep "3B0"
(1778916122.716047) vcan0 3B0#0000000000000000
(1778916125.784145) vcan0 3B0#0000000000000000
(1778916128.813210) vcan0 3B0#0000000000000000
root@9cd4b4f4f139:/# cat candump.log | grep "321"
(1778916122.715577) vcan0 321#0322F19000000000
(1778916124.735584) vcan0 321#0322F19000000000
(1778916125.532145) vcan0 0C0#27B0000000000000
(1778916126.793806) vcan0 321#0322F19000000000
(1778916128.813173) vcan0 321#0322F19000000000
(1778916128.813210) vcan0 3B0#0000000000000000
root@9cd4b4f4f139:/# cat candump.log | grep "180"
(1778916121.704679) vcan0 180#7D00000000000000
(1778916122.715515) vcan0 180#7C00000000000000
(1778916123.725890) vcan0 180#7F00000000000000
(1778916124.735484) vcan0 180#7D00000000000000

```

As we can see, there are a lot of IDs, but not really userful because I couldn't communicate with them with `isotprecv` and `isotpsend` and I don't know why :(.

After getting stuck for a while, I realized that there’s a good description of the challenge; maybe I should read it more carefully:
```
Diagnostic CAN IDs: tester 0x7E0 ↔ ECU 0x7E8
```

OH YES! Maybe we can use CAN ID 0x7E0 and 0x7E8... But what are CAN IDs?
IDs in the CAN bus are used for physical addressing during communication with the ECU.

Now we know how to comunicate with a ECU. Let's use `isotprecv`:

```bash
root@c37f42bb4c89:/# isotprecv -s 7e0 -d 7e8 vcan0 &
```

> The `&` is userful to run the bash command in background

But this command alone doesn't provide any information, because we have to send a signal to the ECU and wait for a response. So we would use `isotpsent`:

```bash
root@c37f42bb4c89:/# echo "11" | isotpsend -s 7e0 -d 7e8 vcan0
```
But we receive:
```bash
7f 11 11
```
At least we got a response. But what are these hex values? I try to search it and I found this docs https://ramn.readthedocs.io/en/latest/userguide/diag_tutorial.html where is written:
```
- 0x11 - “Service not supported”.
- 0x7F - “Service not supported in active session”: same as above, but for services instead of sub-functions.
```
On the same page, you can see that these codes refer to the UDS protocol, which is used for diagnostics and employs a request-response mechanism to communicate with the ECU. The request begins with the first byte, which specifies the service to be used, followed by bytes representing a sub-function (if necessary).

Another useful information is that an ECU uses 0x7E0 to receive command and 0x7E8 to send response, this is the reason why we set with the flag `-s` the hex value 7e0 and with the flag `-d` 7e8.

Perhaps our hexadecimal value doesn't correspond to an available service. We need to figure out which service we can use, and a UDS scanner might be just what we need. The same banner tell us about `caringcaribou` a tool for car security that integrates an UDS scanner. OOne way to search for services is to use this command: `caringcaribou uds services 0x7E0 0x7E8`.
It found **0x22 (READ DATA BY IDENTIFIER)**

We can now craft a payload with first byte 22, but what should we send next? Maybe we could ask about the Serial Hardware of ECUwith F1 8C?

> `F1 8C` is a DID (Data Indentifier), which is used to request data from ECU in a vehicle. It's like an address where are stored data

```bash
root@c37f42bb4c89:/# isotprecv -s 7e0 -d 7e8 vcan0 &

root@c37f42bb4c89:/# echo "22 F1 8C" | isotpsend -s 7e0 -d 7e8 vcan0
7f 11 33
```
Ok another negative response:
```
0x33 - “Security access denied”: this means that you need to unlock the service (see Security Access (0x27)) before using it.
```
That's because the ECU is locked, so we need to find out how we can unlock it.
In Security Access section of the documentation explains how to submit a request (with `27 01`) to obtain a seed and calculate a key using a cryptographic algorithm. However, we do not know which algorithm is used for authentication... or maybe yes! 
The challenge give us another file called `dealer_unlock.pyc` that is a `Byte-compiled Python module for CPython 3.12`. This file need two arguments: a password and a seed. But we could only get a seed but the password? 
Maybe we need to reverse engineering the binary.

## My solution
From now we define our idea to solve this challenge:
1. Reverse the Python binary 
2. Write a reverse cripto algorithm to compute a key
3. Send the key to the service

We can't see the source code of the binary file, so we have to decompile it. There are many decompilers for Python bytecode, but not all of them are useful. I found a decompiler online that might make our job easier:
https://pylingual.io/


The python code decompiled is the following:
```python
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: '/tmp/dealer_unlock.py'
# Bytecode version: 3.12.0rc2 (3531)
# Source timestamp: 2026-05-13 02:13:16 UTC (1778638396)

"""\nLeaked Linux diagnostic helper.\n"""
def rol32(v, c):
    v &= 4294967295
    c &= 31
    return (v << c | v >> 32 - c) & 4294967295
def ror32(v, c):
    v &= 4294967295
    c &= 31
    return (v >> c | v << 32 - c) & 4294967295
def derive_key(seed):
    x = seed ^ 2781028135
    x = rol32(x, 3)
    x = x + 522125569 & 4294967295
    x ^= 3735928559
    x = ror32(x, 1)
    return x & 4294967295
if __name__ == '__main__':
    import sys
    import hashlib
    if len(sys.argv)!= 3:
        print('usage: dealer_unlock.py <password> <seed_hex>')
        raise SystemExit(1)
    else:
        hash = hashlib.sha1(sys.argv[1].encode()).hexdigest()
        if hash!= 'd5dcd954a0928a024f3cfe35da1d6469c19a170b':
            print('Incorrect password')
            raise SystemExit(1)
        else:
            seed = int(sys.argv[2], 16)
            print(f'{derive_key(seed):08X}')

```

By looking at this code, we can avoid bypassing the hash check since we only want to generate the key. 

```python
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: '/tmp/dealer_unlock.py'
# Bytecode version: 3.12.0rc2 (3531)
# Source timestamp: 2026-05-13 02:13:16 UTC (1778638396)

"""\nLeaked Linux diagnostic helper.\n"""
def rol32(v, c):
    v &= 4294967295
    c &= 31
    return (v << c | v >> 32 - c) & 4294967295
def ror32(v, c):
    v &= 4294967295
    c &= 31
    return (v >> c | v << 32 - c) & 4294967295
def derive_key(seed):
    x = seed ^ 2781028135
    x = rol32(x, 3)
    x = x + 522125569 & 4294967295
    x ^= 3735928559
    x = ror32(x, 1)
    return x & 4294967295
if __name__ == '__main__':
    import sys
    import hashlib
 
    seed = int(sys.argv[1], 16)  #set argv[1] for take the first argument
    print(f'{derive_key(seed):08X}')
```

Now we need to run the Python script, passing the seed as an argument, send the calculated key, and unlock the service.

We request the seed:

```bash
isotprecv -s 7e0 -d 7e8 vcan0 &
[1] 396              
root@c37f42bb4c89:/# echo "27 01" | isotpsend -s 7e0 -d 7e8 vcan0
root@c37f42bb4c89:/# 67 01 46 2D 8C 6E 
```

Just to clarify: we couldn’t send the `27 01` payload directly because the ECU is in a Default (`10 01`) or Programming (`10 02`) session, which are types of Diagnostic Session Controls, and might reject our authentication request. We need to switch it to an Extended Diagnostic Session (`10 03`) before we send `27 01` :
```
root@c37f42bb4c89:/# isotprecv -s 7e0 -d 7e8 vcan0 &
root@c37f42bb4c89:/# echo "10 03" | isotpsend -s 7e0 -d 7e8 vcan0
root@c37f42bb4c89:/# 50 03 00 32 01 F4 
```

Using the key in our python script:

```bash
[shackwove@pwned automotive]$ python3 exploit.py 462D8C6E
F01F12DF
```
Ok, we got the key, let's send it:

```bash 
root@c37f42bb4c89:/# isotprecv -s 7e0 -d 7e8 vcan0 &
[1] 404
root@c37f42bb4c89:/# echo "27 02 F0 1F 12 DF" | isotpsend -s 7e0 -d 7e8 vcan0
root@c37f42bb4c89:/# 67 02 
```

The code `67` tell us that the service has been unlocked, now we are close to the flag :))))

We need to send a request to a valid DID to obtain the flag. After a few attempts (and so many re-connections that have undone all the work I've done so far), I wrote a simple script that performs a brute-force attack on DIDs and we found that DID `13 37` is the winner.

```bash
root@c37f42bb4c89:/# isotprecv -s 7e0 -d 7e8 vcan0 &
[1] 407
root@c37f42bb4c89:/# echo "22 13 37" | isotpsend -s 7e0 -d 7e8 vcan0
root@c37f42bb4c89:/# 62 13 37 66 6C 61 67 7B 73 33 33 64 6B 33 79 5F 72 33 76 33 72 73 33 64 7D 

```

`66 6C 61 67 7B 73 33 33 64 6B 33 79 5F 72 33 76 33 72 73 33 64 7D ` is our flag!

Flag: spoiler[flag{s33dk3y_r3v3rs3d}]


