# Release checklist

## 1. Real sites, by hand

Load `dist/chrome-mv3` in Chrome, then repeat the marked rows in Firefox.

- [ ] Forum thread with attached photos: a click opens the viewer, the forum's own lightbox stays closed.
- [ ] Shop product page: product photos open, the photo carousel still swipes (mouse and touch), a tap opens the viewer.
- [ ] Image host such as Unsplash: photo pages and grids open the largest version.
- [ ] Flickr: plain click follows the link; Alt-click opens the viewer.
- [ ] Image search results (e.g. DuckDuckGo images): nothing breaks; Alt-click opens a result image.
- [ ] A news front page and an article: teasers navigate, Alt-click opens.

## 2. Firefox

- [ ] Backdrop blur behind the viewer renders (it is missing in headless Firefox).
- [ ] "All sites" off: grey toolbar icon with "off" badge; on again restores the coloured icon.
- [ ] Remove the site access in the add-on's permissions, open the popup, press "Allow access", confirm the prompt; images open again.
- [ ] Swipe carousel on a shop page swipes; a tap opens the viewer.
- [ ] Context menu "Show in Magic Image Viewer" on a gallery photo, a logo and an image inside an iframe.

## 3. Chrome

- [ ] Local files: switch on "Allow access to file URLs" for the extension, open a local `.jpg` — the viewer shows it.
- [ ] Toolbar icon grey while switched off for the current site, coloured on other sites.

## 4. Publish

- [ ] Say OK to tag: `v1.0.0` is then pushed, and CI attaches the Chrome package, the Firefox package and the Firefox source package to the GitHub release.
- [ ] Chrome Web Store: upload `magic-image-viewer-1.0.0-chrome.zip`, fill the listing from `listings/`, screenshots, icon, review answers from `permissions.md`.
- [ ] AMO: upload `magic-image-viewer-1.0.0-firefox.zip` and the sources zip, listing from `listings/`, screenshots.
