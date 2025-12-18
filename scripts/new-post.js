/* This is a script to create a new post markdown file with front-matter */

import fs from "fs"
import path from "path"
import readline from "readline"

const writeupTemplate = `

## Introduction

...

## Source

...

\`\`\`python
# filename: main.py



\`\`\`

...

## Solution

...

\`\`\`python
# filename: exploit.py



\`\`\`

flag: :spoiler[flag{ redacted }]
`


function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No filename argument provided
Usage: npm run new-post -- <filename>`)
  process.exit(1) // Terminate the script and return error code 1
}

let fileName = args[0]

// Add .md extension if not present
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
  fileName += ".md"
}

const targetDir = "./src/content/posts/"
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists `)
  process.exit(1)
}

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve)
  })
}

async function main() {
  let categoryDefault = ''
  const templateChoice = await ask("Choose template:\n1. Writeup Post\n2. Generic\n")
  if (templateChoice === '1') {
    categoryDefault = 'writeup'
  } else if (templateChoice === '2') {
    categoryDefault = 'blog'
  } else {
    categoryDefault = ''
  }

  const title = await ask(`Title (default: ${args[0]} il nome deve essere del formato <ctf_name>-<challenge_name>): `) || args[0]
  const description = await ask("Description: ") || "''"
  const image = await ask("Image: ") || "''"
  const tagsInput = await ask("Tags (comma separated eg: web,crypto,rev): ") || ""
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : []
  const authorsInput = await ask("Authors (comma separated): ") || ''
  const authors = authorsInput ? authorsInput.split(',').map(a => a.trim()) : []
  const solves = await ask("Solves (number): ") || '-1'
  const points = await ask("Points (number): ") || '-1'
  const firstbloodInput = await ask("Firstblood (y/n): ") || "n"
  const firstblood = firstbloodInput.toLowerCase().startsWith('y')
  const category = await ask(`Category (default: ${args[0]}): `) || args[0]
  const draftInput = await ask("Draft (y/n): ") || 'n'
  const draft = draftInput.toLowerCase().startsWith('y')
  const lang = await ask("Language (default: en): ") || 'en'

  const content = `---
title: ${title}
published: ${getDate()}
description: ${description}
image: ${image}
tags: ${JSON.stringify(tags)}
authors: ${JSON.stringify(authors)}
${solves !== '-1' ? `solves: ${solves}\n` : ''}
${points !== '-1' ? `points: ${points}\n` : ''}
category: ${category}
firstblood: ${firstblood}
draft: ${draft}
lang: ${lang}
---
${templateChoice === '1' ? writeupTemplate : ''}
`

  fs.writeFileSync(fullPath, content)

  console.log(`Post ${fullPath} created`)
  rl.close()
}

main()
