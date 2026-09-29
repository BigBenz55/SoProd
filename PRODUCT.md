# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Nuxt 4 (Vue 3 + Nitro server), SQLite (`node:sqlite`, pas de module natif), sharp for WebP proxies, basic-ftp / ssh2-sftp-client for the Box, Tailwind CSS v4. The source spec asked for PHP 8.2 on Hostinger shared hosting; the user explicitly switched to Nuxt. Deployment therefore needs a Node.js-capable host (Hostinger Node.js web app plan or VPS).

## Users

- **The photographer / videographer (SoProd)**: delivers wedding, corporate and studio shoots; manages galleries from a private back-office.
- **Newlyweds (primary clients)**: receive a private link after the wedding, browse on phone and laptop, mark favourites, download HD originals.
- **Guests**: receive a public link, browse in lower definition, download only if the photographer allows it.

## Product Purpose

A self-hosted replacement for Pixieset/Shootproof: zero recurring subscription, fully branded delivery, originals kept in full definition on a hard drive plugged into the photographer's ISP Box, exposed over FTP/SFTP.

## Positioning

Private, owned delivery: the studio's own storage, own brand, no third-party logos, no SaaS in between.

## Operating Context

- Originals (RAW/masters, MP4) live on the Box disk, reached via FTP/SFTP + dynamic DNS + port forwarding.
- The web server builds and caches light WebP proxies; galleries never load from the Box directly. Originals are streamed through the server only on explicit download, hiding the Box address.
- If the Box is offline, galleries keep working from the cache; only downloads pause.
- Favourites export as filename lists for Adobe Lightroom's library filter.

## Capabilities and Constraints

- Private link: UUID token, optional 4-digit PIN, HD download, favourites.
- Public link: low-definition viewing, original download toggle.
- Link validity: 30, 60, 90 days per project, or permanent (no expiry).
- Gallery: masonry grid, lightbox (keyboard, swipe, zoom), HTML5 progressive video.
- Back-office: create gallery (name, date, event type Mariage/Corporate/Studio), pick remote folder, one-click indexing, Lightroom export, cache purge.
- Limited disk on the web host; limited home upload bandwidth.

## Brand Commitments

- Name: **SoProd**.
- Black and white, chic, aimed at newlyweds (user-pinned).
- Interface language: French.

## Evidence on Hand

No real photos, testimonials, prices, or contact details were provided. Demo imagery is generated and labelled as demo; contact email/Instagram are placeholders to replace.

## Product Principles

1. The photographs lead; the interface recedes.
2. Nothing heavy ever travels from the Box unless a download was asked for.
3. A couple should find, heart and download their photos without instructions.
4. Owned, not rented: no external branding or dependency in the delivery path.
