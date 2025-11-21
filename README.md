# BytetheCookies Blog - based on Fuwari Template

A static blog template built with [Astro](https://astro.build).

## 🚀 Getting Started

1. Create your blog repository:
    - [Generate a new repository](https://github.com/saicaca/fuwari/generate) from this template or fork this repository.
    - Or run one of the following commands:
       ```sh
       npm create fuwari@latest
       yarn create fuwari
       pnpm create fuwari@latest
       bun create fuwari@latest
       deno run -A npm:create-fuwari@latest
       ```
2. To edit your blog locally, clone your repository, run `pnpm install` to install dependencies.
    - Install [pnpm](https://pnpm.io) `npm install -g pnpm` if you haven't.
3. Edit the config file `src/config.ts` to customize your blog.
4. Run `pnpm new-post <filename>` to create a new post and edit it in `src/content/posts/`.
5. Deploy your blog to Vercel, Netlify, GitHub Pages, etc. following [the guides](https://docs.astro.build/en/guides/deploy/). You need to edit the site configuration in `astro.config.mjs` before deployment.

## 📝 Frontmatter of Posts

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
authors: [akiidjk, anotherAuthor] # Optional, it not specified, the Anonymous author will be used
solves: 10        # Optional, number of solves if it's a CTF writeup -1 for remove it 
points: 500       # Optional, points awarded if it's a CTF writeup -1 for remove it
firstblood: true  # Optional, set to true if it's the first solve
tags: [web,crypto,etc../]
category: CTFName
draft: false
lang: en      # Set only if the post's language differs from the site's language in `config.ts`
---
```

## 🧩 Markdown Extended Syntax

In addition to Astro's default support for [GitHub Flavored Markdown](https://github.github.com/gfm/), several extra Markdown features are included:

- Admonitions ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#admonitions))
- GitHub repository cards ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#github-repository-cards))
- Enhanced code blocks with Expressive Code ([Preview](https://fuwari.vercel.app/posts/expressive-code/) / [Docs](https://expressive-code.com/))

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Installs dependencies                               |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`         |
| `pnpm build`               | Build your production site to `./dist/`             |
| `pnpm preview`             | Preview your build locally, before deploying        |
| `pnpm check`               | Run checks for errors in your code                  |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-post <filename>` | Create a new post                                   |
| `pnpm astro ...`           | Run CLI commands like `astro add`, `astro check`    |
| `pnpm astro --help`        | Get help using the Astro CLI                        |

## ✏️ Contributing

Check out the [Contributing Guide](https://github.com/saicaca/fuwari/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_large&issueType=license)
