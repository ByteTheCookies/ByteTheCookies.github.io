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

1. Run `hugo new content --kind ctf writeups/namectf.md`
2. Create a directory with the name of CTF
3. Run `hugo new content --kind writeup writeups/namectf/namechallange.md`
4. Run ``` hugo server --buildDrafts ```