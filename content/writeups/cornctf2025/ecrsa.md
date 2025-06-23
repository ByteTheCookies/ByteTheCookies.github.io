+++
title = 'ECRSA'
date = 2025-06-23T18:30:32+02:00
tags = [
  "crypto",
  "496 points",
  "4 solves",
  "Just_Riccio"
]
draft = true
+++

# ECRSA
RSA or Elliptic Curves? Why not both?

## Introduction

ECRSA was a crypto CTF from [cornCTF 2025](https://ctftime.org/event/2762).

```python
#!/usr/bin/env python3
from secret_params import curve_p, a, b, order, secret_point_x, secret_point_y
import os

FLAG = os.getenv("FLAG", "corn{__redacted_redacted_redacted__redacted_redacted_redacted__}").encode()

assert FLAG.startswith(b"corn{") and FLAG.endswith(b"}")
assert len(FLAG) == 64

def sign(m, x):
    if m == 0 or m == 1 or m == n-1:
        print("No weak messages allowed here")
        return None
    try:
        user_point = E.lift_x(x)
    except ValueError:
        print(f"Invalid point: {x} does not describe any point on the curve")
        return None
    sig = pow(m, d, n)
    sig = sig * user_point + secret_point
    return sig.xy()[0], sig.xy()[1]

def verify(sig, m, x):
    try:
        user_point = E.lift_x(x)
    except ValueError:
        print(f"Invalid point: {x} does not describe any point on the curve")
        return False
    sig_point = sig - secret_point
    # don't want to make you wait too long
    # c = sig_point.log(user_point)
    c = 0x69
    c = pow(c, e, n)
    return c == m

assert curve_p.bit_length() == 513
assert order.bit_length() == 513

K = GF(curve_p)
a = K(a)
b = K(b)
K = GF(curve_p)
E = EllipticCurve(K, (a, b))
E.set_order(order)
secret_point = E(secret_point_x, secret_point_y)

flag = int.from_bytes(FLAG, byteorder='big')

p = random_prime(2<<255, lbound=2<<254)
q = random_prime(2<<255, lbound=2<<254)
n = p*q

while flag >= n or n>curve_p or n>order:
    p = random_prime(2<<255, lbound=2<<254)
    q = random_prime(2<<255, lbound=2<<254)
    n = p*q

e = 0x10001
d = pow(e, -1, (p-1)*(q-1))

print("Welcome to my custom signing and verification system!")
print("Here are my public parameters:")
print(f"e: {e}")
print(f"n: {n}")

print(f"Leak: {pow(flag, e, n)}")

while True:
    print("1. Sign\n2. Verify\n3. Exit")
    choice = int(input())
    if choice == 1:
        m = int(input("Enter message: "))
        x = Integer(input("Enter x-coordinate of your point: "))
        sig = sign(m, x)
        print(f"Signature: {sig}")
    elif choice == 2:
        try:
            sig_x = Integer(input("Enter x-coordinate of signature: "))
            sig_y = Integer(input("Enter y-coordinate of signature: "))
            sig = E(sig_x, sig_y)
        except TypeError:
            print("Invalid signature")
            continue
        m = int(input("Enter message: "))
        x = K(Integer(input("Enter x-coordinate of your point: ")))
        if verify(sig, m, x):
            print("Valid signature")
        else:
            print("Invalid signature")
    elif choice == 3:
        break
    else:
        print("Invalid choice")
```
The flag is simply encrypted with RSA, while the service provides a modified ECDSA signing oracle.

## Solution
There are 3 steps to the solution:
1. Recover the `secret_point`
2. Figure out the curve parameters
3. Obtain the flag

### Recovering `secret_point`
This step is really easy as the check in `sign` for the value of `m` is done before the modular reduction, therefore sending a multiple of the modulus will pass the check but `pow(m, d, n)` will result in a `0`, meaning `sign` will give back `secret_point`

### Figuring out the curve parameters
With `secret_point` now ours and being able to provide `sign` with any `user_point` we can query the oracle to obtain a few points on the curve, with said points we can recover the parameters:
```python
def solve_curve_parameters(r):
    points = set()

    for x_in in trange(1, 100):
        try:
            point = sign(r, n+1, x_in)
            points.add(point)
            if len(points) >= 10: # arbitrary
                break
        except:
            continue

		points = list(points)
    dets = []
    for i in range(len(points) - 3):
        (x1, y1), (x2, y2), (x3, y3) = points[i], points[i+1], points[i+2]

		    # Y = y^2 - x^3 -> Y = ax + b (mod p).
        Y1 = y1**2 - x1**3
        Y2 = y2**2 - x2**3
        Y3 = y3**2 - x3**3

				# w := Y1 - Y2 = a(x1 - x2) (mod p)
				# z := Y2 - Y3 = a(x2 - x3) (mod p)
				# So w(x2 - x3) and z(x1 - x2) differ by a multiple of p
        I = (Y1 - Y2) * (x2 - x3) - (Y2 - Y3) * (x1 - x2)

        if I != 0:
            dets.append(I)

    p = gcd(dets)
    dx = x1 - x2
    a = (Y1 - Y2) * pow(dx, -1, p) % p

    # From Y1 = a*x1 + b (mod p), we solve for b.
    b = (Y1 - a * x1) % p

    # Check if (y3^2) % p == (x3^3 + a*x3 + b) % p
    lhs = y3**2 % p
    rhs = (x3**3 + a * x3 + b) % p

    if lhs == rhs:
        return p, a, b

    return None, None, None
```

### Getting the flag
The idea is to use an LSB-Oracle:

> $c \equiv m^e \pmod n$
> $(2^ec)^d \equiv 2m \pmod n$
> the previous value is even if $m \leq n/2$, odd otherwise (because $n$ is odd)
> so we can construct bit by bit the value of $m$ by multiplying $c$ by $2^e$ each time

In the context of the challenge we need a way to distinguish odd and even values of `pow(m, d, n)`. This can be achieved with a point of order $2$ on the curve, since when `pow(m, d, n)` is even, multiplying it with our given point $P$ will give the identity, which added to `secret_point` will give this one back, otherwise we'll get $P$ plus `secret_point`.
```python
def lsb_oracle(r, P):
    l, u = 0, n

    c = enc_flag
    e2 = pow(2, e, n)
    for _ in trange(n.bit_length()):
        c *= e2
        Q = E(sign(r, c % n, P.xy()[0])) - sp # sp = secret_point
        if Q == E.zero():
            u = (l + u) >> 1
        else:
            l = (l + u) >> 1
    return (l + u) >> 1
```

### Full solve script
```python
import os
os.environ['TERM'] = 'linux'

from pwn import *
from tqdm import trange

# Signing utility
def sign(r, m, x):
    r.recvuntil(b't\n')
    r.sendline(b'1')
    r.recvuntil(b': ')
    r.sendline(str(m).encode())
    r.recvuntil(b': ')
    r.sendline(str(x).encode())

    r.recvuntil(b': ')
    data = r.recvline(False).decode()[1:-1].split(', ')
    return int(data[0]), int(data[1])


def solve_curve_parameters(r):
    points = set()

    for x_in in trange(1, 100):
        try:
            point = sign(r, n+1, x_in)
            points.add(point)
            if len(points) >= 10: # arbitrary
                break
        except:
            continue

    points = list(points)
    dets = []
    for i in range(len(points) - 3):
        (x1, y1), (x2, y2), (x3, y3) = points[i], points[i+1], points[i+2]

		# Y = y^2 - x^3 -> Y = ax + b (mod p).
        Y1 = y1**2 - x1**3
        Y2 = y2**2 - x2**3
        Y3 = y3**2 - x3**3

		# w := Y1 - Y2 = a(x1 - x2) (mod p)
		# z := Y2 - Y3 = a(x2 - x3) (mod p)
		# So w(x2 - x3) and z(x1 - x2) differ by a multiple of p
        I = (Y1 - Y2) * (x2 - x3) - (Y2 - Y3) * (x1 - x2)

        if I != 0:
            dets.append(I)

    p = gcd(dets)
    dx = x1 - x2
    a = (Y1 - Y2) * pow(dx, -1, p) % p

    # From Y1 = a*x1 + b (mod p), we solve for b.
    b = (Y1 - a * x1) % p

    # Check if (y3^2) % p == (x3^3 + a*x3 + b) % p
    lhs = y3**2 % p
    rhs = (x3**3 + a * x3 + b) % p

    if lhs == rhs:
        return p, a, b

    return None, None, None

def lsb_oracle(r, P):
    l, u = 0, n

    c = enc_flag
    e2 = pow(2, e, n)
    for _ in trange(n.bit_length()):
        c *= e2
        Q = E(sign(r, c % n, P.xy()[0])) - sp
        if Q == E.zero():
            u = (l + u) >> 1
        else:
            l = (l + u) >> 1
    return (l + u) >> 1

r = remote('ecrsa.challs.cornc.tf', 1337, ssl=True) if args.REMOTE else process('./ecrsa.sage')

e = 65537
r.recvuntil(b'n: ')
n = int(r.recvline(False).decode())
r.recvuntil(b'k: ')
enc_flag = int(r.recvline(False).decode())

p, a, b = solve_curve_parameters(r)
E = EllipticCurve(GF(p), [a, b])
# order = E.order()
# Cached for speed
order = 16069075899419272706313306230384148392684766596987923274252840802156807638348274231565457533546984784193487763139164096443059279726687808489053779972143886
E.set_order(order)
q = order // 2

# Get point of order 2
while (P := E.random_point()).order() != order: continue
P *= q

assert P.order() == 2

# Get secret point
sp = E(sign(r, 2*n, 1))

m = lsb_oracle(r, P)
# Last byte isn't always right, just ignore and force the }
print('flag:', int(m).to_bytes(64)[:-1].decode() + '}')


r.close()
```
```
flag: corn{br34k1ng_dl0g_15_h4rd_bu7_m0d_2_m4k35_3v3ry7h1ng_funn13r!!}
```
<p align="right">Author: vympel</p>
