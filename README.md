# ByteTheCookies

## Develop notes

Utils section for those developing the pages

### Configuration

- The file to edit for the navbar is in /config/params
- The file to edit the various section is /config/menus/en or it
- The main config file are in /config

### Content

The page are structured in this mode:

```text
.
├── en
│   ├── about (main page)
│   │   ├── args1.md
│   │   ├── args2.md
│   │   └── index.md
│   ├── _index.md
│   └── Other content (Like Writeups/Credits/Events/...)
│       ├── _index.md
│       └── arg1.md
├── it
    └─── _index.md

```

### Images/static elements

The images/icons and more are located in the "static" directory (it is not necessary to specify /static).

### Layout

[Details](https://kaiiiz.github.io/hugo-theme-monochrome/layouts/)

### Writeups creations

1. Create a file readme with the name of CTF

```markdown

+++
title = 'name'
author = "author"
description = "desc"
date = 2024-08-05T18:26:54+02:00
tags = [
    "categories",
]
type = 'list'
+++

```

2. Create a directory with the name of CTF
3. In the directory of CTF insert all Markdown file with the name of Challenge

```markdown
+++
title = 'Name'
date = 2024-08-06T11:27:07+02:00
draft = true #Important
+++

```
4. Run ``` hugo server --buildDrafts ```
