+++
title = ''
tags = [
  "category",
  "language",
  "attack type",
  "n points",
  "n solves",
  "authors",
]
date = {{ .Date }}
draft = true
+++

{{ $capitalized := printf "%s" .File.BaseFileName | title }}

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>{{ replace $capitalized "_" " " }}</h1>

**Description**: ...

## Introduction

...

## Source

...

```python
# filename: file.py



```

...

## Solution

...

```python
# filename: file.py



```

```stdout
$ flag: flag{redacted}
```
<p align='right'>Author: ... </p>
