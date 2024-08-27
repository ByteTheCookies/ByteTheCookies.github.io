+++
title = 'Crack Me'
tags = [
  "Rev",
  "Mobile",
  "Javascript/Java",
  "Information leaking",
  "100",
  "187",
  "Sahuang",
]
date = 2024-08-26T17:04:19+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Crack Me</h1>

**Description**: Developed for SekaiCTF 2022 but never got a chance to release it. Can you log in and claim the flag?

## Introduction

First rev ctf of Sekai 2024 with an apk attached, so we have a mobile challenge on our hands.
The first thing to do (which I strongly advise against in a real environment) is to download and install the app to get a quick overview of what it does.

<div style="display:flex; height:50vh">
  <img alt="img-app1" style="margin:0px" src="/images/crackme/app-image1.jpeg">
  <img alt="img-app1" style="margin:0px" src="/images/crackme/app-image2.jpeg">
</div>

As you can see, the app doesn't allow us to do much more than press the button and log in (without being able to register).

## First step

The first thing I did was to analyse the apk using an online tool. [SISIK](https://sisik.eu/apk-tool)

And two interesting pieces of information came up: the first was that it was a react-native app, which helps us a lot in reverse, and that the app was using firebase to handle the backend and probably authentication as well.

## Second Step

The apk is actually a compressed set of java files like a zipper and tar, this then allows us to easily extract the contents with any tool like unzip or 7z (in my case I used extract which is a utils of zsh).

Once we have extracted the contents we should find something like this

![alt text](/images/crackme/image.png)

As we can see, we have a huge number of files, but this is where tools like [grep](https://www.gnu.org/software/grep/manual/grep.html) or [fzf](https://github.com/junegunn/fzf) come in.

This allows us to search for files based on keywords as in my case: admin,sekai,user,password

After some research we can find us an obfuscated js file named: index.android.bundle

After some research we can find there a file named index.android.bundle with some obfuscated javascript inside, knowing that the application is written in react-native and that inside this file there are keywords like: admin,sekai,password, it is definitely an interesting file.

## Third Step

One possible idea might be a react-native app decompiler, which fortunately exists and is easy to find in the case I used: [React Native Decompiler](https://github.com/numandev1/react-native-decompiler)

Once installed, and running the command `react-native-decompiler index.android.bundle -o bundle_deobfuscated`, we should find about 800 js files, a bit confusing but understandable with a little effort.

## Fourth Step

We can reuse grep and fzf to search again for the words of interest.

By searching, we manage to find a really interesting file, in which we find the login system that is done in the application.

```javascript
function _() {
  var e, o;
  module25.default(this, _);
  (e = L.call(this, ...args)).state = {
    email: "",
    password: "",
    wrongEmail: false,
    wrongPwd: false,
    checked: false,
    verifying: false,
    errorTitle: "",
    errorMessage: "",
  };
  e._verifyEmail =
    ((o = module275.default(function* (t) {
      t.setState({
        verifying: true,
      });
      var n = module478.initializeApp(module477.default),
        o = module486.getDatabase(n);
      if (
        "admin@sekai.team" !== t.state.email ||
        false === e.validatePassword(t.state.password)
      )
        console.log("Not an admin account.");
      else console.log("You are an admin...This could be useful.");
      var s = module488.getAuth(n);
      module488
        .signInWithEmailAndPassword(s, t.state.email, t.state.password)
        .then(function (e) {
          t.setState({
            verifying: false,
          });
          var n = module486.ref(o, "users/" + e.user.uid + "/flag");
          module486.onValue(n, function () {
            t.setState({
              verifying: false,
            });
            t.setState({
              errorTitle: "Hello Admin",
              errorMessage: "Keep digging, you are almost there!",
            });
            t.AlertPro.open();
          });
        })
        .catch(function (e) {
          // Different error messages
        });
    })),
    function (e) {
      return o.apply(this, arguments);
    });

  e.validatePassword = function (e) {
    if (17 !== e.length) return false;
    var t = module700.default.enc.Utf8.parse(module456.default.KEY),
      n = module700.default.enc.Utf8.parse(module456.default.IV);
    return (
      "03afaa672ff078c63d5bdb0ea08be12b09ea53ea822cd2acef36da5b279b9524" ===
      module700.default.AES.encrypt(e, t, {
        iv: n,
      }).ciphertext.toString(module700.default.enc.Hex)
    );
  };
}
```

Now let's analyse the operation of the login... as we can see the email that checks for the login is only one, that of the admin `admin@sekai.team` and the password is checked with a function in particular `validatePassword`.

Going to analyse the function, we see that the decryption of a hex string is done via AES, but even more important detail, the IV and the Key are imported from another file, by analysing the form in question we can find out the value of the IV and the Key.

```javascript
var _ = {
  LOGIN: "LOGIN",
  EMAIL_PLACEHOLDER: "user@sekai.team",
  PASSWORD_PLACEHOLDER: "password",
  BEGIN: "CRACKME",
  SIGNUP: "SIGN UP",
  LOGOUT: "LOGOUT",
  KEY: "react_native_expo_version_47.0.0",
  IV: "__sekaictf2023__",
};
exports.default = _;
```

This allows us to easily find the password even with a trivial Python script like this one:

```python

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

key = b"react_native_expo_version_47.0.0"[:32]
iv = b"__sekaictf2023__"
ciphertext = binascii.unhexlify(
    "03afaa672ff078c63d5bdb0ea08be12b09ea53ea822cd2acef36da5b279b9524")
email = "admin@sekai.team"

def decrypt_password():
  cipher = AES.new(key, AES.MODE_CBC, iv)
  decrypted = unpad(cipher.decrypt(ciphertext), AES.block_size)

  password = decrypted.decode('utf-8')
  assert len(password) == 17

  return password

  def main():
    password = decrypt_password()
    print("password:", password)
    print("email: ", email)

if __name__ == '__main__':
    main()


# OUTPUT:

# password: s3cr3t_SEKAI_P@ss
# email: admin@sekai.team

```

**PERFECT**! It's done, we have the flag, we just need to log in to the application

<img alt="img-app3" style="height:50vh; margin:0px" src="/images/crackme/app-image3.jpeg">

OR MAYBE NOT 😥...

## Fifth step

After a moment's panic, I resume checking the code and how the login system works; indeed, we can see that as soon as the login is complete, a request is made to the database (probably the [firebase realtime database](https://firebase.google.com/docs/database))

So, in a sense, the flag has been given to us, we just have to catch it on the fly, and there are two ways of doing that.

## Unintended solution

The first solution was to intercept the call and answer from the app to the db and vice versa, but using arch with an NVIDIA video card I had trouble with Android emulation, but you can still find a solution. [similar solution](https://ggcoder.medium.com/solving-crackme-from-sekaictf-9660dc41b0ce)

## Intended solution (The one i performed)

Given my difficulties with the emulation of the application, I continued my search for code, this time also searching Firebase, and managed to find something very interesting

```javascript
var c = {
  apiKey: "AIzaSyCR2Al5_9U5j6UOhqu0HCDS0jhpYfa2Wgk",
  authDomain: "crackme-1b52a.firebaseapp.com",
  projectId: "crackme-1b52a",
  storageBucket: "crackme-1b52a.appspot.com",
  messagingSenderId: "544041293350",
  appId: "1:544041293350:web:2abc55a6bb408e4ff838e7",
  measurementId: "G-RDD86JV32R",
  databaseURL: "https://crackme-1b52a-default-rtdb.firebaseio.com",
};
exports.default = c;
```

As you can see, we are faced with a firebase configuration file with sensitive information that allows us to connect directly to the firebase database using js.
So in the end we just need to replicate the functions used in the login to get the flag.

## Solution

...

```python
# filename: exploit.py

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import binascii
import subprocess

key = b"react_native_expo_version_47.0.0"[:32]
iv = b"__sekaictf2023__"
ciphertext = binascii.unhexlify(
    "03afaa672ff078c63d5bdb0ea08be12b09ea53ea822cd2acef36da5b279b9524")
email = "admin@sekai.team"


def get_flag(email, password):
    process = subprocess.Popen(
        ["node", "exploit.js", email, password],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    stdout, stderr = process.communicate()

    print(stdout.decode('utf-8'))

    if stderr:
        print(stderr.decode('utf-8'))

def decrypt_password():
  cipher = AES.new(key, AES.MODE_CBC, iv)
  decrypted = unpad(cipher.decrypt(ciphertext), AES.block_size)

  password = decrypted.decode('utf-8')
  assert len(password) == 17

  return password

def main():
    password = decrypt_password()
    print("password:", password)
    print("email: ", email)
    get_flag(email, password)


if __name__ == '__main__':
    main()

```

```javascript
// filename: exploit.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { exit } from "process";

let app = initializeApp({
  apiKey: "AIzaSyCR2Al5_9U5j6UOhqu0HCDS0jhpYfa2Wgk",
  authDomain: "crackme-1b52a.firebaseapp.com",
  storageBucket: "crackme-1b52a.appspot.com",
  projectId: "crackme-1b52a",
  messagingSenderId: "544041293350",
  appId: "1:544041293350:web:2abc55a6bb408e4ff838e7",
  measurementId: "G-RDD86JV32R",
  databaseURL: "https://crackme-1b52a-default-rtdb.firebaseio.com",
});

var db = getDatabase(app);
var auth = getAuth(app);

async function loginAndGetFlag(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Logged in");
    var n = ref(db, "users/" + userCredential.user.uid + "/flag");

    const snapshot = await get(n);
    if (snapshot.exists()) {
      console.log("Flag value:", snapshot.val());
    }
  } catch (error) {
    console.error("Error logging in or fetching flag:", error);
  }
}

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
```

```stdout
$ flag: SEKAI{15_React_N@71v3_R3v3rs3_H@RD???}
```

<p align='right'>Author: akiidjk </p>
