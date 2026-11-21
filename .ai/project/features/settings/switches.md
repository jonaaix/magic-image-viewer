---
id: settings-switches
created: 2026-11-21
tags: [settings, popup, languages]
---

# Switching the viewer off and its languages

## What is it for?

Visitors decide where the viewer takes over: everywhere, or everywhere except sites where they
prefer the site's own behaviour. The extension speaks the visitor's language.

## How does it work?

### The popup

The toolbar button opens a small panel, readable at a glance, from top to bottom:

- **Header:** the app icon, the name and the version.
- **Status:** one sentence on the current state — active on this site, off on this site, off
  everywhere, or not available here. Active is tinted green, everything else stays grey. While
  active on a web page, a second line counts the images on the page ("12 images on this page"),
  counted exactly as the viewer collects its gallery.
- **Switches**, described below.
- **Trust:** "100% private — no data leaves your browser", linking to the privacy policy, and
  "Free forever — open source", linking to the repository.
- **Buy me a coffee:** a full-width button in the brand's yellow, labelled in English in every
  language, as it is the brand name. It appears only once its link is configured.
- **Footer:** "by jonaaix" linking to the author's GitHub profile, then icon buttons with
  tooltips to star the project on GitHub, report a bug (the repository's issues) and the source
  code.

Links only open new tabs; the popup needs no extra permission and makes no network requests.

The two switches:

- **All sites** turns the whole extension on or off. Off means no click handling, no key
  protection, no viewer on image tabs and no context-menu entry.
- **This site**, labelled with the host name of the current page, turns the automatic behaviour
  off for that host only: clicks and image tabs are left to the site. The context-menu entry still
  opens the viewer there, because choosing it is an explicit request. The switch is greyed out
  while all sites are off. For local files it reads "Local files".

Both switches take effect at once in every open tab, without reloading, and are kept across
browser restarts. On pages where extensions cannot run — browser pages, extension stores — the
status reads "Not available on this page" and the site switch is gone. In a file tab the site
switch is gone too, because it does not apply there.

When the browser has not granted access to websites (Firefox lets the visitor withhold or
withdraw it), the panel shows a warning with a button that asks for it.

### State at the toolbar icon

While the extension is off — everywhere, or on the current site — the toolbar icon turns grey and
carries a short badge ("off" in English).

### Languages

All text — popup, context-menu entry, badge, every label and tooltip of the viewer, and the store
description — follows the browser's language: English, German, French, Spanish, Italian,
Portuguese (Brazil and Portugal), Dutch and Polish. Other languages get English. There is no
language setting of its own. The name "Magic Image Viewer" is never translated.

## Examples

- Switching "All sites" off on a shop page: the next click on a product photo opens the shop's own
  zoom; the context menu no longer offers the entry; the icon turns grey and shows "off".
- Switching the site off on a news site: photos there open as the site intends, while photos on
  another site still open in the viewer; after a reload or a browser restart the news site stays
  off; right-clicking a photo there and choosing the entry still opens the viewer.
- With German as browser language, the close button's tooltip reads "Schließen" and the popup
  says "Alle Websites".
