# Clipboard Manager

A smart, local-first clipboard manager extension for Microsoft Edge & Chrome. Built for developers, IT pros, and power users who deal with code snippets, commands, Markdown, SQL, and more every day.

**Store once, copy forever.** No cloud, no tracking, no bullshit.

## Features
- **Local storage** with IndexedDB (privacy-first, unlimited capacity)
- Categorize snippets with custom colors and tags
- Fuzzy search with keyword highlighting
- Card / List view switch
- Dark mode (system-follow or manual)
- Syntax highlighting for code (JS, Python, Bash, SQL, etc.)
- Import/export JSON backups (with preview & merge confirmation)
- Delete confirmation & clear all cache
- Settings page (default view, theme preference) with chrome.storage.sync
- Manifest V3 compliant, lightweight & fast

## Tech Stack
- Vue 3 + Composition API
- Vite (fast build & dev)
- Element Plus (UI components)
- Dexie.js (IndexedDB wrapper)
- highlight.js (syntax highlighting)
- chrome.storage.sync (cross-device settings sync)

## Installation (Development)
1. Clone the repo