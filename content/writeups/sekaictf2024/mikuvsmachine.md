+++
title = 'Miku vs. Machine'
tags = [
  "PPC",
  "Python",
  "100 points",
  "176 solves",
  "null_awe",
]
date = 2024-08-26T17:04:29+02:00
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Miku vs. Machine</h1>

**Description**: Time limit is 2 seconds for this challenge.

[**Official resources of challenge**](https://ppc.chals.sekai.team)

## Introduction

The goal is to distribute the hours of `n` singers in `m` shows.
Each show has a number of hours equal to `l` (unknown) and can only change singers once.
We also want that each singer will have the same time on stage.

## Solution

To solve this problem, I use a **greedy** strategy that iteratively divides the available singing time among the singers, ensuring that each singer fulfills their required hours.

```python
T = int(input())

for _ in range(T):
    n, m = map(int, input().split(' '))
    l = n
    print(l)
    duration_for_singer = m
    singers = [duration_for_singer] * n
    for i in range(len(singers)):
        while singers[i] > 0:
            show = []
            if (singers[i] - l) >= 0:
                show.append((l//2, i+1))
                show.append((l - l//2, i+1))
                singers[i] -= l
            elif singers[i] < l:
                show.append((singers[i], i+1))
                show.append((l - singers[i], i+2))
                singers[i+1] -= l - singers[i]
                singers[i] = 0
            print(f"{show[0][0]} {show[0][1]} {show[1][0]} {show[1][1]}")
```

## Step-by-Step Explanation

1. **Initialization**

- The first input `T` represents the number of test cases.
- After some experimentation on pen and paper, I noticed that the minimum value of `l` is equal to the number of singers, so `l` is set to `n`.
- I initialize a list `singers` of length `n`, where each element is set to `m` to represent the remaining singing hours for each singer.

2. **Time Distribution Logic**

- I iterate over each singer using a loop. For each singer `i`, the following steps are performed:
  - **While Loop**: Continue allocating time to the current singer as long as they have hours remaining (`singers[i] > 0`).
  - **Time Allocation**:
    - If the current singer has `l` or more hours remaining, divide `l` hours into two chunks:
      - The first chunk is `l//2` hours, and the second chunk is `l - l//2` hours. Both chunks are allocated to the same singer.
      - Subtract `l` from the singer's remaining hours.
    - If the current singer has less than `l` hours remaining:
      - Allocate all remaining hours to the current singer.
      - Allocate the rest of `l` to the next singer in line (`i+2`).
      - Subtract the hours from the next singer's total.
  - **Output**:
    - After each allocation, the result is stored in a list `show` and printed in the format `{hours1} {singer1} {hours2} {singer2}`.

3. **Output**

- The program prints the number `l` as the first line for each test case.
- For each show, the specific distribution of hours between the singers is printed.

## Example Execution

### Input

`n` = 4 \
`m` = 7

### Execution

`l` = 4 \
`singers` = [7, 7, 7, 7]

- `i` = 0

  - `show` = (hours:2 singer:1 , hours:2 singer:1) \
    `singers` = [3, 7, 7, 7]

  - `show` = ( hours:3 singer:1 , hours:1 singer:2 ) \
    `singers` = [0, 6, 7, 7]

- `i` = 1

  - `show` = ( hours:2 singer:2 , hours:2 singer:2 ) \
    `singers` = [0, 2, 7, 7]

  - `show` = ( hours:2 singer:2 , hours:2 singer:3 ) \
    `singers` = [0, 0, 5, 7]

- `i` = 2

  - `show` = ( hours:2 singer:3 , hours:2 singer:3 ) \
    `singers` = [0, 0, 1, 7]

  - `show` = ( hours:1 singer:3 , hours:3 singer:4 ) \
    `singers` = [0, 0, 0, 4]

- `i` = 3
  - `show` = ( hours:2 singer:4 , hours:2 singer:4 ) \
    `singers` = [0, 0, 0, 0]

### Output

```stdout
4
2 1 2 1
3 1 1 2
2 2 2 2
2 2 2 3
2 3 2 3
1 3 3 4
2 4 2 4
```

## Conclusion

I don't consider this challenge difficult, it's just a greedy algorithm (it takes a lot more to scare a LeetCode boy), but it wasn't immediately clear that the output didn't necessarily have to be the same as that shown in the challenge's PDF , but it was enough to fit the constraints of the problem.

```stdout
$ flag: SEKAI{t1nyURL_th1s:_6d696b75766d}
```

<p align='right'>Author: Tatore </p>
