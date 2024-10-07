+++
title = 'Rivest, Shamir, Adleman 1'
tags = [
  "Crypto",
  "476 points",
  "62 solves",
  "Dope_cat",
]
date = 2024-10-06T13:49:39+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Rivest, Shamir, Adleman 1</h1>

**Description**: Little John came across an article on RSA encryption. Intrigued but only partially understanding it, he decided to write a script and started using it to communicate with his aunt. Can you figure out what he's discussing?

## Introduction

Rivest, Shamir, Adleman 1 was a crypto CTF from [IRON CTF 2024](https://ctftime.org/event/2497) organized by [Team 1nf1n1ty](https://ctftime.org/team/151859).

```python
from Crypto.Util.number import *

m = open("flag.txt",'rb').read()

m = bytes_to_long(m)

p = getPrime(1024)
q = getPrime(1024)
N = p*q

e = getRandomNBitInteger(16)
c = pow(m,e,N)
p_ = p >> (200)

print(f"{(p_,N,e,c)=}")

# (p_,N,e,c)=(78251056776113743922781362749830646373211175353656790171039496888342171662458492506297767981353887690931452440620588460424832375197427124943346919084717792877241717599798699596252163346397300952154047511640741738581061446499402444306089020012841936, 19155750974833741583193175954281590563726157170945198297004159460941099410928572559396586603869227741976115617781677050055003534675899765832064973073604801444516483333718433505641277789211533814981212445466591143787572063072012686620553662750418892611152219385262027111838502078590253300365603090810554529475615741997879081475539139083909537636187870144455396293865731172472266214152364966965486064463013169673277547545796210067912520397619279792527485993120983571116599728179232502586378026362114554073310185828511219212318935521752030577150436386831635283297669979721206705401841108223134880706200280776161816742511, 37929, 18360638515927091408323573987243771860358592808066239563037326262998090628041137663795836701638491309626921654806176147983008835235564144131508890188032718841579547621056841653365205374032922110171259908854680569139265494330638365871014755623899496058107812891247359641915061447326195936351276776429612672651699554362477232678286997748513921174452554559807152644265886002820939933142395032126999791934865013547916035484742277215894738953606577594559190553807625082545082802319669474061085974345302655680800297032801212853412563127910754108599054834023083534207306068106714093193341748990945064417347044638122445194693)
```

It is a typical rsa challenge where you're given a "leak": some part of the private key which allows you to retrieve it fully. We're given the most significant bits of `p` and must figure out the rest.

## Solution

We'll use [Coppersmith's method](https://link.springer.com/chapter/10.1007/3-540-68339-9_14) to find the 200 lowermost bits of `p` (`beta` has a default value of `1` which must be tweaked to solve this)

```python
R.<x> = PolynomialRing(Zmod(N))

lsb = (p_*2^200 + x).monic().small_roots(beta=0.4)
p = Integer(p_*2^200 + lsb[0])

assert is_prime(p)
```

One more trouble to solve is that $gcd(e, \phi) \ne 1$, so we must generate all possible plaintexts corresponding to our ciphertext ([source](https://medium.com/@g2f1/bad-rsa-keys-3157bc57528e)).

```python
q = N // p
phi = (p - 1) * (q - 1)

k = 1
while gcd(e, phi/k) != 1:
    k *= gcd(e, phi/k)

d = inverse_mod(e, phi/k)

roots = [power_mod(a, phi/k, N) for a in range(1, 100)]

g = power_mod(c, d, N)

plaintexts = [r * g % N for r in roots]
```

This is the full solve script in sagemath.

```python
p_, N, e, c = (78251056776113743922781362749830646373211175353656790171039496888342171662458492506297767981353887690931452440620588460424832375197427124943346919084717792877241717599798699596252163346397300952154047511640741738581061446499402444306089020012841936, 19155750974833741583193175954281590563726157170945198297004159460941099410928572559396586603869227741976115617781677050055003534675899765832064973073604801444516483333718433505641277789211533814981212445466591143787572063072012686620553662750418892611152219385262027111838502078590253300365603090810554529475615741997879081475539139083909537636187870144455396293865731172472266214152364966965486064463013169673277547545796210067912520397619279792527485993120983571116599728179232502586378026362114554073310185828511219212318935521752030577150436386831635283297669979721206705401841108223134880706200280776161816742511, 37929, 18360638515927091408323573987243771860358592808066239563037326262998090628041137663795836701638491309626921654806176147983008835235564144131508890188032718841579547621056841653365205374032922110171259908854680569139265494330638365871014755623899496058107812891247359641915061447326195936351276776429612672651699554362477232678286997748513921174452554559807152644265886002820939933142395032126999791934865013547916035484742277215894738953606577594559190553807625082545082802319669474061085974345302655680800297032801212853412563127910754108599054834023083534207306068106714093193341748990945064417347044638122445194693)

R.<x> = PolynomialRing(Zmod(N))

lsb = (p_*2^200 + x).monic().small_roots(beta=0.4)
p = Integer(p_*2^200 + lsb[0])

assert is_prime(p)

q = N // p
phi = (p - 1) * (q - 1)

k = 1
while gcd(e, phi/k) != 1:
    k *= gcd(e, phi/k)

d = inverse_mod(e, phi/k)

roots = [power_mod(a, phi/k, N) for a in range(1, 100)]

g = power_mod(c, d, N)

plaintexts = [r * g % N for r in roots]

for pt in plaintexts:
    bs = pt.to_bytes(pt.bit_length() // 8 + 1)
    if b'iron' in bs:
        print('flag:', bs.decode())
        break
```

```
$ flag: ironCTF{@Un7_CaN_yoU_53Nd_me_THOS3_3xp@NSIon_5cREws}
```

<p align="right">Author: vympel</p>