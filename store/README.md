# Store material

| What | Where | Used for |
| --- | --- | --- |
| Listing texts, nine languages | `listings/<locale>.md` | Name, summary and description in both stores |
| Review answers | `permissions.md` | Single purpose, permission justifications, remote code, data usage, Firefox source |
| Screenshots, 1280 × 800 | `screenshots/` | Both stores (Chrome takes 1–5, AMO recommends 1280 × 800) |
| Store icon, 128 × 128 (96 px artwork, 16 px padding) | `icon-128.png` | Chrome Web Store |
| Small promo tile, 440 × 280 | `promo-440x280.png` | Chrome Web Store, optional |
| Release checklist | `release-checklist.md` | Manual checks and upload steps |
| Demo page | `demo/` | Source of the screenshots |

The AMO icon comes from the package (`icons/48.png`, `icons/96.png`).

Regenerate: `node scripts/demo-landscapes.mjs`, `npm run build && npm run build:test`, then
`node scripts/store-assets.mjs`. The browser's language decides the language of the popup
screenshot.
