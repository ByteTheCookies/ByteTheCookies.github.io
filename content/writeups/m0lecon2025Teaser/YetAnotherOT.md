+++
title = 'Yet Another OT'
tags = [
  "Crypto",
  "127 points",
  "29 solves",
  "Drago",
]
date = 2024-09-15T10:58:00+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Yet Another OT</h1>

**Description**: Why do people always want to decrypt both messages?

## Disclaimer

I wasn't able to solve this challenge during the competition, but managed to get to the solution after talking on discord to other competitors who very kindly helped me figure it out.

## Introduction

Yet Another OT was a crypto CTF from [m0leCon 2025](https://ctftime.org/event/2440) hosted by [pwnthem0le](https://pwnthem0le.polito.it/).

```python
import random
from hashlib import sha256
import json
import os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

random = random.SystemRandom()


def jacobi(a, n):
    if n <= 0:
        raise ValueError("'n' must be a positive integer.")
    if n % 2 == 0:
        raise ValueError("'n' must be odd.")
    a %= n
    result = 1
    while a != 0:
        while a % 2 == 0:
            a //= 2
            n_mod_8 = n % 8
            if n_mod_8 in (3, 5):
                result = -result
        a, n = n, a
        if a % 4 == 3 and n % 4 == 3:
            result = -result
        a %= n
    if n == 1:
        return result
    else:
        return 0


def sample(start, N):
    while jacobi(start, N) != 1:
        start += 1
    return start


class Challenge:
    def __init__(self, N):
        assert N > 2**1024
        assert N % 2 != 0
        self.N = N
        self.x = sample(int.from_bytes(sha256(("x"+str(N)).encode()).digest(), "big"), N)
        ts = []
        tts = []
        for _ in range(128):
            t = random.randint(1, self.N)
            ts.append(t)
            tts.append(pow(t, N, N))
        print(json.dumps({"vals": tts}))
        self.key = sha256((",".join(map(str, ts))).encode()).digest()

    def one_round(self):
        z = sample(random.randint(1, self.N), self.N)
        r0 = random.randint(1, self.N)
        r1 = random.randint(1, self.N)

        m0, m1 = random.getrandbits(1), random.getrandbits(1)

        c0 = (r0**2 * (z)**m0) % self.N
        c1 = (r1**2 * (z*self.x)**m1) % self.N

        print(json.dumps({"c0": c0, "c1": c1}))
        data = json.loads(input())
        v0, v1 = data["m0"], data["m1"]
        return v0 == m0 and v1 == m1

    def send_flag(self, flag):
        cipher = AES.new(self.key, AES.MODE_ECB)
        ct = cipher.encrypt(pad(flag.encode(), 16))
        print(ct.hex())


FLAG = os.environ.get("FLAG", "ptm{test}")

def main():
    print("Welcome to my guessing game!")
    N = int(input("Send me a number: "))
    chall = Challenge(N)
    for _ in range(128):
        if not chall.one_round():
            exit(1)
    chall.send_flag(FLAG)


if __name__ == "__main__":
    main()

```

We can remotely interact with this service to recover the flag.

## Analysis

Let's start with the functions:
`jacobi(a, n)`
computes the [Jacobi symbol](https://en.wikipedia.org/wiki/Jacobi_symbol) of `a mod n`

`sample(start, N)`
returns the first `s >= start` such that `sample(s, N) == 1`

Let's look at the class `Challenge` now:
`__init__(self, N)`

- `N` is checked to be odd and greater than $2^{1024}$
- `self.x` is generated from `sample(int.from_bytes(sha256(("x"+str(N)).encode()).digest(), "big"), N)`
- A loop generates 128 random private values `ts` and their public counterpart `tts`
- `self.key` is generated from `sha256((",".join(map(str, ts))).encode()).digest()`

`one_round(self)`

- `z` is generated from `sample(random.randint(1, self.N), self.N)`
- `r0, r1` are random integers in the range $[1, N]$
- `m0, m1` are randomly chosen from $\{0, 1\}$
- $c_0 \equiv r_0^2 \cdot z^{m_0} \pmod N$
- $c_1 \equiv r_1^2 \cdot (z \cdot x)^{m_1} \pmod N$
- `c0, c1` are shared and the user has to correctly guess `m0, m1` to continue to the next round

`send_flag(self, flag)`

- encrypts the flag with `AES` using `self.key` and sends it to the user

## Solution

The first objective is retrieving the `AES` key, so from each `pow(t, N, N)` I had to get `t`.
My idea was to use [Fermat's little theorem](https://en.wikipedia.org/wiki/Fermat%27s_little_theorem), therefore setting `N` to be prime would make it so `tts == ts`. This allows easy recovery of `self.key` but it's also a grave mistake...
The second objective is guessing `m0` and `m1` 128 times in a row to finally get the encrypted flag and decrypt it with our key. The idea is to use theory about [quadratic residues](https://en.wikipedia.org/wiki/Quadratic_residue), but this is where I got stuck: if `N` is prime this is actually impossible as `sample` will always generate a correct quadratic residue and therefore these two cases are indistinguishable

$$
\begin{cases}
	c_0 \equiv r_0^2 \cdot z \pmod N \\
	c_0 \equiv r_0^2 \pmod N
\end{cases}
$$

After the end of the CTF I asked on discord for help on figuring out where I went wrong and some competitors who solved it kindly explained it to me.
The idea is to use a different value for `N`.
Recovering the private key requires "decrypting" the public values which are encrypted using the usual [RSA](<https://en.wikipedia.org/wiki/RSA_(cryptosystem)>) method, we expect this to be hard without knowing the factorization of `N`, but as we're the ones to choose it we can simply generate some primes, take their product and decrypting is easy as we have the factorization of `N`.
Now that `N` is composite `sample` won't always generate quadratic residues mod `N` (there is still a possibility but it's low enough to be ignored) so as soon as the [Legendre symbol](https://en.wikipedia.org/wiki/Legendre_symbol) of `c0` for any of the prime factors of N isn't 1 we know we must be in the case where `m0 == 1` (same goes for `c1`and `m1`).
After 128 rounds we are given the encrypted flag which we can just decrypt as we have the key.

```python
from Pwn4Sage.pwn import *
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import json, hashlib

r = remote('yaot.challs.m0lecon.it', 2844)

primes = [random_prime(2^(32), lbound=2^31) for _ in range(33)]
N = prod(primes)

assert N > 2^1024

phi = prod([p - 1 for p in primes])
d = inverse_mod(N, phi)

# Pwn4Sage doesn't have sendlineafter
r.sendafter(b'number: ', str(N).encode() + b'\n')

tts = json.loads(r.recvline().rstrip())['vals']

ts = [pow(tt, d, N) for tt in tts]

key = hashlib.sha256((",".join(map(str, ts))).encode()).digest()

for _ in range(128):
    data = json.loads(r.recvline().rstrip())

    c0, c1 = data['c0'], data['c1']

    m0 = int(any(legendre_symbol(c0, p) != 1 for p in primes))
    m1 = int(any(legendre_symbol(c1, p) != 1 for p in primes))

    payload = json.dumps({'m0': m0, 'm1': m1}).encode()

    r.sendline(payload)

enc_flag = bytes.fromhex(r.recvline().rstrip().decode())

cipher = AES.new(key, AES.MODE_ECB)

flag = unpad(cipher.decrypt(enc_flag), 16).decode()

print('flag:', flag)
```

```
$ flag: ptm{t0_b3_0r_n07_t0_b3_4_qu4dr471c_r351du3?}
```

<p align="right">Author: vympel</p>
