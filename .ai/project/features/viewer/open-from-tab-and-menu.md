---
id: viewer-open-from-tab-and-menu
created: 2026-11-21
tags: [viewer, context-menu, image-tab]
---

# Opening an image from its own tab or the context menu

## What is it for?

A picture opened on its own in a browser tab is shown in the viewer straight away, with the same
zoom, pan and download as on a page. Any image, including one that a click would not open, can be
opened in the viewer from its context menu.

## How does it work?

### An image in its own tab

When a tab shows a single image or video file — a PNG, JPEG, WebP, GIF or other raster image, or
a video the browser plays — the file exists only in the viewer. It opens at once, with the video in
the viewer's own player, filling the screen up to a narrow edge with the bars floating above it
and fading when idle. It cannot be closed: there is no close button, and neither Escape, a
downward drag nor a click beside the picture closes it; Escape only resets the zoom. The browser's
own video underneath stays paused and silent. The per-site switch does not apply to such tabs and
the popup does not offer it there; only the switch for all sites turns this off. SVG files are left
to the browser.

### The context menu

The context menu of every image carries the entry "Show in Magic Image Viewer". When the image is
part of the page gallery, the viewer opens the gallery at its place, exactly as a click would.
Otherwise — a logo, an icon, an image too small to count, or an image inside an embedded frame — the
viewer opens with that picture alone. Images inside frames always open alone, in the viewer of the
page around them. When the viewer cannot run in the tab, for example because the page was open
before the extension was installed, the image opens in a new tab next to it, where it is shown in
the viewer.

The entry's text comes from the browser's language files. The entry disappears while the
extension is switched off for all sites; switched off for one site, it keeps working there
(see `settings-switches`).

### Local files

Images and pages opened from the computer (`file://`) depend on the browser. Chrome shows the
viewer there once the visitor allows the extension access to file URLs in its settings; unpacked
installs have that access already. Firefox does not run the extension on local files.

## Examples

- A link to `holiday.jpg` opened in a new tab: the viewer shows the photo and stays; Esc only
  resets the zoom.
- A local `clip.mp4` opened in Chrome: it plays in the viewer, once, with one sound track.
- A link to `diagram.svg` opened in a new tab: the browser shows the drawing as usual.
- Right-clicking the second of four photos in an article and choosing the entry opens "2 / 4".
- Right-clicking the site logo and choosing the entry shows the logo alone, "1 / 1".
- Right-clicking a photo inside an embedded frame shows it alone over the page.
