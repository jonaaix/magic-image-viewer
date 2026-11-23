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

## 4. Edge

- [ ] Load `dist/chrome-mv3` in Edge (`edge://extensions`, developer mode, "Load unpacked") and repeat the rows of section 1.

## 5. Publish

- [ ] Say OK to tag: `v1.0.0` is then pushed, and CI attaches the Chrome package, the Firefox package and the Firefox source package to the GitHub release.
- [ ] Chrome Web Store: upload `magic-image-viewer-1.0.0-chrome.zip`, fill the listing from `listings/`, screenshots, icon, review answers from `permissions.md`.
- [ ] AMO: upload `magic-image-viewer-1.0.0-firefox.zip` and the sources zip, listing from `listings/`, screenshots.
- [ ] Microsoft Partner Center: upload the same `magic-image-viewer-1.0.0-chrome.zip`, listing from `listings/`, screenshots.
- [ ] Hand over the three store addresses; they replace "coming soon" in the README's head line and its Install table.

## 6. Automatic store upload

From the second version on, a pushed `v*` tag uploads the packages and submits them for review.
CI submits to each store whose secrets are set and skips the others. Add the secrets under
GitHub → Settings → Secrets and variables → Actions → New repository secret. A store needs its
first version uploaded by hand; a version already submitted by hand cannot be uploaded again.

Chrome Web Store (extension ID `oonincilgnkpgboibfkinloncibankbc` is in the workflow):

1. Google Cloud console: create a project, enable the "Chrome Web Store API".
2. IAM → Service accounts → create one, then Keys → Add key → JSON. Keep the downloaded file.
3. Chrome Web Store dashboard → Account: add the service account's email address.
4. Secret `CHROME_SERVICE_ACCOUNT_KEY`: the whole content of the JSON file.
5. Secret `CHROME_PUBLISHER_ID`: the ID in the dashboard address, `…/devconsole/<publisher ID>/…`.

Firefox Add-ons (add-on ID `magic-image-viewer@jonaaix.github.io` is in the workflow):

1. addons.mozilla.org → Developer Hub → Manage API keys → generate credentials.
2. Secrets `FIREFOX_JWT_ISSUER` and `FIREFOX_JWT_SECRET`.

Edge Add-ons:

1. Partner Center → Microsoft Edge → Publish API → create API credentials.
2. Secrets `EDGE_CLIENT_ID` and `EDGE_API_KEY`.
3. Secret `EDGE_PRODUCT_ID`: the product ID on the extension's overview page.
