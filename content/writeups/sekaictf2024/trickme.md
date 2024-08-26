+++
title = 'Some Trick'
date = 2024-08-26T17:04:19+02:00
tags = [
  "Cryptography",
  "Python",
  "100 points",
  "127 solves",
  "deut-erium"
]
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'> Some Trick </h1>

**Description**: Bob and Alice found a futuristic version of opunssl and replaced all their needs for doofy wellmen.

## Introduction

Some Trick was the first cryptography challenge in the 2024 edition of SekaiCTF. The challenge implements a key exchange based on a set of permutations and asks us to retrieve the flag that was used as a key in Bob's first encryption.

```python
import random
from secrets import randbelow, randbits
from flag import FLAG

CIPHER_SUITE = randbelow(2**256)
print(f"oPUN_SASS_SASS_l version 4.0.{CIPHER_SUITE}")
random.seed(CIPHER_SUITE)

GSIZE = 8209
GNUM = 79

LIM = GSIZE**GNUM


def gen(n):
    p, i = [0] * n, 0
    for j in random.sample(range(1, n), n - 1):
        p[i], i = j, j
    return tuple(p)


def gexp(g, e):
    res = tuple(g)
    while e:
        if e & 1:
            res = tuple(res[i] for i in g)
        e >>= 1
        g = tuple(g[i] for i in g)
    return res


def enc(k, m, G):
    if not G:
        return m
    mod = len(G[0])
    return gexp(G[0], k % mod)[m % mod] + enc(k // mod, m // mod, G[1:]) * mod


def inverse(perm):
    res = list(perm)
    for i, v in enumerate(perm):
        res[v] = i
    return res


G = [gen(GSIZE) for i in range(GNUM)]


FLAG = int.from_bytes(FLAG, 'big')
left_pad = randbits(randbelow(LIM.bit_length() - FLAG.bit_length()))
FLAG = (FLAG << left_pad.bit_length()) + left_pad
FLAG = (randbits(randbelow(LIM.bit_length() - FLAG.bit_length()))
        << FLAG.bit_length()) + FLAG

bob_key = randbelow(LIM)
bob_encr = enc(FLAG, bob_key, G)
print("bob says", bob_encr)
alice_key = randbelow(LIM)
alice_encr = enc(bob_encr, alice_key, G)
print("alice says", alice_encr)
bob_decr = enc(alice_encr, bob_key, [inverse(i) for i in G])
print("bob says", bob_decr)
```

## Solution

The first thing we do is retrieve the `CIPHER_SUITE` variable to set the random seed and reconstruct the set of permutations G, then we care about retrieving `bob_key` to ultimately recover the flag.

```python
s = int(r.recvline().strip().decode().split('.')[-1])
random.seed(s)

G = [gen(GSIZE) for i in range(GNUM)]
```

```python
def decm(k, G, val):
    m = 0
    for i in range(GNUM):
        x = val % GSIZE
        y = gexp(G[i], k % GSIZE).index(x)
        m += y * GSIZE ** i
        val = (val - x) // GSIZE
        k //= GSIZE
    return m

bob_key = decm(alice_encr, G, bob_encr)
```

Recovering the flag takes a bit more work, I've only managed a brute-force solution which I optimized the best I could; it's not the best but it does the job.

```python
def maketable(g):
    gg = deepcopy(g) # just to be safe
    table = {}
    for i in range(GSIZE):
        table[i] = gg
        gg = tuple(gg[i] for i in gg)
    return table

def perm(table, e):
    res = tuple(table[0])
    rbits = reversed(bits(e))
    ones = filter(lambda x: x != -1, [i if v == 1 else -1 for i, v in enumerate(rbits)])
    for index in ones:
        res = tuple(res[j] for j in table[index])
    return res

def findk(queue, event, table, start, end, index, want):
    for k in range(start, min(GSIZE, end)):
        if event.is_set():
            return
        if perm(table, k)[index] == want:
            event.set()
            queue.put(k)
            return

def deck(m, G, val):
    key = 0
    for i in range(GNUM):
        x = val % GSIZE
        table = maketable(G[i])
        queue = mp.Queue()
        event = mp.Event()
        ps = [mp.Process(target=findk, args=(queue, event, table, start, start + (GSIZE // mp.cpu_count()) + 1, m % GSIZE, x)) for start in range(0, GSIZE, GSIZE // mp.cpu_count())][:mp.cpu_count()]
        for p in ps:
            p.start()

        k = queue.get()
        if k == 0:
            return key

        key += k * GSIZE ** i
        val = (val - x) // GSIZE
        m //= GSIZE
    return key + m * GSIZE ** GNUM

key = deck(bob_key, G, bob_encr)
```

The recovered key isn't the flag yet, as it went through some transformations first, but it's clear that the flag's bits are still there in the middle, untouched between the two paddings, so we can just do some shifting until we find it.

```python
    for i in range(key.bit_length()):
        shifted = key >> i
        for j in range(1, shifted.bit_length()):
            keepmask = (1 << j) - 1
            final = shifted & keepmask
            dec = final.to_bytes(keepmask.bit_length() // 8 + 1)
            if b'SEKAI{' in dec:
                start = dec.index(b'SEKAI')
                end = start + dec[start:].index(b'}') + 1
                print(f'flag: {dec[start:end].decode()}')
                break
        else:
            continue
        break
```

```
flag: SEKAI{7c124c1b2aebfd9e439ca1c742d26b9577924b5a1823378028c3ed59d7ad92d1}
```

<p align="right">Author: vympel</p>
