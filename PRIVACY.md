# Privacy

Magic Image Viewer does not collect, store or transmit any personal data. No data leaves your
browser.

- No analytics, no tracking, no account, no advertising.
- The extension makes no network requests of its own and loads no remote code. Images shown in the
  viewer are loaded by the page you are visiting, exactly as the page itself would load them.
- The only data the extension keeps are your two settings — whether it is on for all sites, and
  the host names of sites you switched it off for. They are stored locally in your browser
  (`storage.local`) and are never synced or sent anywhere.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| Access to all websites (content script on `<all_urls>`) | To find the images of the page you are viewing and open them in the viewer when you click them. The script reads the page's images and nothing else, and sends nothing anywhere. |
| `contextMenus` | To add "Show in Magic Image Viewer" to the context menu of images. |
| `storage` | To remember your on/off settings on this device. |
| `activeTab` | To show the host name of the current page in the popup, so you can switch the viewer off for that site. |

## Contact

Questions: open an issue at https://github.com/jonaaix/magic-image-viewer/issues.
