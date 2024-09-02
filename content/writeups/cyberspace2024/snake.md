+++
title = 'Snake'
tags = [
  "Reverse",
  "Rust",
  "File patching",
  "50 points",
  "122 solves",
  "0xM4hm0ud",
]
date = 2024-09-02T10:59:36+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Snake</h1>

**Description**: Can you slither to the win?

**Link to the binary**: [Elf file](https://2024.csc.tf/files/263575efcd73ff01d2bf123993065b37/snake?token=eyJ1c2VyX2lkIjo3ODgsInRlYW1faWQiOjM5MCwiZmlsZV9pZCI6MTJ9.ZtWYng.7QVOp_u1X-NXMNS72mApiwM1GqU)

## Introduction

We are faced with a binary file written in Rust (you can see it by simply running `strings snake | grep rustc`) where we are made to play Snake, the goal is to get **PRECISELY** to `16525` points.

![alt text](/images/snake/image.png)

## Solution

The solutions were actually different, some people used tools to analyze the memory of a process in real time, I preferred a 'slower' approach, or rather the first thing that came to mind, so I opened binary ninja despite the file being stripped and looked for a value for constant exactly 0xa (i.e. the value that was added every time it ate a `#`).

In a short time I managed to find this:

![alt text](/images/snake/image-1.png)

After some trial and error, changing the value from 0xa to 0xb, I find the line of code I need, which is the last one in the screenshot above.

At this point I switch to the assembly and notice that my initial approach was wrong this is because I was putting too high a value in a register that it did not support in fact analysing the binary in assembly we see:

![alt text](/images/snake/image-2.png)

As we can see, before entering the constant into the dword register [rcx+0x7c], we first enter it into eax and if we enter too high a value, the programme simply crashes (as it should).

So simply afterwards I chose to put the precise value in the correct register once I had made at least one point

![alt text](/images/snake/image-3.png)

(the nop are automatically inserted by binary ninja)

In this way, once we have scored at least one point, we will have the flag

![alt text](/images/snake/image-4.png)

```stdout
$ flag: CSCTF{Y0u_b34T_My_Sl1th3r_G4m3!}
```

<p align='right'>Author: akiidjk </p>
