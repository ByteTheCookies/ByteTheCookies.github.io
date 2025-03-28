+++
title = 'Key in the haystack'
date = 2025-03-24T16:25:00+01:00
tags = [
  "crypto",
  "428 points",
  "17 solves",
  "Pietro Lepori"
]
draft = true
+++

# Confusion
I've encrypted my secret message with RSA.

Easy stuff, right?

Well, I'm not giving you the key outright...

I've hidden it in a haystack!

Sure, a key is not a needle, and this haystack is not that big.

It shouldn't take more than 10' to find it, if you have an half-decent metal detector.

Good luck!


## Introduction

Confusion was a crypto CTF from [K!nd4SUS CTF 2025](https://ctftime.org/event/2703).

```python
from Crypto.Util import number
from base64 import b64encode

prime = lambda: number.getPrime(512)
def b64enc(x):
	h = hex(x)[2:]
	if len(h) % 2:
		h = '0' + h
	return b64encode(bytes.fromhex(h)).decode()


p = prime()
q = prime()
with open("flag.txt") as f:
	flag = f.readline().strip()

n = p * q
m = int(flag.encode().hex(), 16)
c = pow(m, 65537, n)

print("ciphertext:", hex(c)[2:])

bale = [p, q]
bale.extend(prime() for _ in range(1<<6))

def add_hay(stack, straw):
	x = stack[0]
	for i in range(1, len(stack)):
		y = stack[i]
		stack[i] = y + (straw * x)
		x = y
	stack.append(straw * x)

stack = [1]
add_hay(stack, p)
add_hay(stack, q)
for straw in bale:
	add_hay(stack, straw)

print("size:", len(stack))
for x in stack:
	print(b64enc(x))
```
The challenge encrypts the flag with RSA and constructs a `stack` via the `add_hay` function which we're then given to try to recover the primes $p$ and $q$ used to create the modulus $n$.

## Solution
The intended solution is to solve the list of equations provided by `stack`, this is why the description suggests it might take about 10 minutes.
But I found out a much simpler solution by simply "looking" at what `stack` looks like if $p$ and $q$ are seen as variables, which I simulated using sagemath:
```python
sage: from Crypto.Util.number import getPrime
....:
....: p, q = PolynomialRing(ZZ, 'p,q').gens()
....: bale = [p, q]
....: bale.extend(getPrime(512) for _ in range(1<<6))
....:
....: def add_hay(stack, straw):
....:     x = stack[0]
....:     for i in range(1, len(stack)):
....:         y = stack[i]
....:         stack[i] = y + (straw * x)
....:         x = y
....:     stack.append(straw * x)
....:
....: stack = [1]
....: add_hay(stack, p)
....: add_hay(stack, q)
....: for straw in bale:
....:     add_hay(stack, straw)
```
By looking at the end of `stack` it's easy to see that both the last and second to last entries have a factor of $pq$, with a simple `gcd` we can therefore recover $n$.
Looking now at the second and third to last entries (which I'll call $s_2$ and $s_3$ respectively) we can see that:
$s_2 = zp^2q^2 + 2cp^2q + 2cpq^2$
$s_3 = xp^2q^2 + yp^2q + ypq^2 + cp^2 + wpq + cq^2$

With some modular reduction (and a division):
$v_2 := \frac{s_2 \pmod{n^2}}{n} = 2cp + 2cq$
$v_3 :\equiv c(p^2 + q^2) \pmod n$

Then since $(p + q)^2 \equiv p^2 + q^2 \pmod n$ we have:
$a :\equiv 2^{-1}v_2 \pmod n \equiv c(p + q) \pmod n$
$b :\equiv a^2 \pmod n \equiv c^2\left(p^2 + q^2\right) \pmod n$

Finally we can recover $c$, and therefore $\phi(n)$ with:
$c \equiv bv_3^{-1} \pmod n$
$\phi(n) = n - \left(ac^{-1} \pmod n\right) + 1$

```python
from base64 import b64decode as bd
from math import gcd

ct = 0x7434d263623892ca660f4139c54ab02a8a14d87cd5c658fca9105f88f7ed5c888a744e949b716094c1d73fd8084eeaf72b23e97325829a69ca57a34e5e0b5272ddaf039bcc0aed2055968c8dfa7cd0373cca072c31123e6259659af03ce87b224bb7fdf13fb89b4ceb580d2d11524025ccb4f86560f3b006d99d86a63ab3aa5a
size = 69

stack = []
with open('output.txt', 'r') as f:
    f.readline(); f.readline()
    for _ in range(size):
        stack.append(int.from_bytes(bd(f.readline().rstrip())))

n = gcd(stack[-1], stack[-2])

v2 = stack[-2] % (n*n) // n
v3 = stack[-3] % n

a = v2 * pow(2, -1, n) % n
b = pow(a, 2, n)

c = b * pow(v3, -1, n) % n

phi = n - (a * pow(c, -1, n) % n) + 1

d = pow(65537, -1, phi)
m = pow(ct, d, n)

print('flag:', m.to_bytes(-(m.bit_length()//-8)).decode())
```
```
flag: KSUS{6465726976617469766573206172652061206e69636520747269636b}
```
<p align="right">Author: vympel</p>
