---
title: CookieFarm v1.3.0 -  IT’S HERE
published: 2026-05-07
description: "After a massive stretch of development, refactoring, and infrastructure work, CookieFarm v1.3.0 is finally live."
tags: ["CookieFarm", "CTF", "A/D", "Release"]
category: News
authors: ["ByteTheCookies Team"]
---

This is not a small iteration. This is a structural upgrade across the entire system.
We pushed the project into a new stage: cleaner architecture, stronger backend systems, and a real operational workflow for teams.

## What’s new

### Web UI Dashboard

A completely new dashboard is now in place.
Centralized control, better visibility, and a real interface for managing the system instead of relying only on CLI flows.

### Exploit Management System

One of the biggest additions in this release.

A proper exploit management layer for teams:

* organize exploits
* share them easily
* manage workflows instead of scattered files

This changes how collaboration works in CookieFarm.

### Custom TCP Flag Protocol

A new low-level communication protocol for sending flags to the server.

Faster, more flexible, and fully custom-built for this system.

### Dynamic Flag ID Parser

A new parsing engine that adapts to different environments and formats automatically. No more rigid assumptions.

### Tooling and Infrastructure Overhaul

This release also includes:

* redesigned exploit file handling
* new server installation scripts
* random string generator for exploit development
* full module refactor with go.work
* improved logging and test infrastructure
* SonarQube integration with coverage tracking
* performance and database improvements

## Breaking Changes (important)

This release includes breaking changes you need to be aware of:

* `ckc config login` → `ckc login`
* `ckc config update` → `ckc config edit`
* `CONFIG_FILE` is now a string (custom paths supported)
* Server connection is now required for all commands except config edit

## Why this release matters

v1.3.0 is not just a feature drop.
It’s a foundation shift.

We moved from a set of tools to a structured platform with proper workflows, collaboration, and scalability.

## Full changelog

From [**v1.2.1 → v1.3.0**](https://github.com/ByteTheCookies/CookieFarm/compare/v1.2.1...v1.3.0)

## Contributors

Major work from:

* @giovanni
* @suga
* @akiidjk
