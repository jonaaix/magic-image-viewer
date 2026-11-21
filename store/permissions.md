# Store review answers

Copy these into the Chrome Web Store dashboard (Privacy practices) and the AMO submission form.

## Single purpose

Opens images of web pages in a full-screen viewer with zoom, pan and a gallery of the page's
images.

## Permission justifications

| Permission | Justification |
| --- | --- |
| Host permission `<all_urls>` (content script) | The extension's purpose is to view the images of any web page the user visits. The content script finds the page's images and opens the viewer when the user clicks one. It cannot know in advance which sites the user wants to view images on, so it runs on all of them. It reads only images and sends nothing anywhere. |
| `contextMenus` | Adds the entry "Show in Magic Image Viewer" to the context menu of images, so any image can be opened on request. |
| `storage` | Stores the user's two settings locally: on/off for all sites, and the list of sites the user switched off. |
| `activeTab` | Lets the popup read the address of the current tab when the user opens it, to show the site's host name next to the "This site" switch. |

## Remote code

No, I am not using remote code. All code ships in the package; nothing is fetched or evaluated at
runtime.

## Data usage

- Collected data: none of the listed categories.
- Certify: the extension does not sell or transfer user data, does not use it for purposes
  unrelated to its single purpose, and does not use it to determine creditworthiness.
- Privacy policy URL: https://github.com/jonaaix/magic-image-viewer/blob/main/PRIVACY.md

## Firefox

- Manifest declares `data_collection_permissions: { required: ["none"] }` (required for new AMO
  submissions since 3 November 2025, understood from Firefox 140; hence `strict_min_version`
  140.0).
- Source code: upload `magic-image-viewer-<version>-sources.zip` from the release. Build
  instructions for the reviewer: Node.js 24, then `npm ci` and `npm run build:firefox`; the result
  is `dist/firefox-mv3`. Dependencies come from npm and from the public GitHub repositories
  `jonaaix/laravel-islands` and `jonaaix/laravel-islands-gallery`, pinned in `package-lock.json`.
