---
id: viewer-click-to-open
created: 2026-11-21
tags: [viewer, image-detection, gallery]
---

# Opening a page image in the viewer

## What is it for?

On any web page, a click on a picture that is meant to be looked at opens it full screen in the
viewer, where it can be zoomed and panned. All such pictures of the page form one gallery, so the
visitor can step through them without going back to the page. Logos, icons, avatars and other
decoration never open.

## How does it work?

### Which images count

An image counts as a content image when it is visible and rendered at least about 100 px on its
shorter side. A smaller image still counts when it is a thumbnail of at least about 40 px that
links to an image file. A lazy image that has no size yet because it has not loaded counts as long
as the page does not hide it. Images inside buttons, form controls or editable content, sprites
and tracking pixels never count. Only the page itself is searched, not embedded frames.

### The gallery

The list is read fresh at the moment of opening, so images the page added since the last opening
are included. It follows the page's order, lists every picture once, and includes lazy images that
have not loaded yet.

For each picture the viewer shows the largest version the page offers, looked up in this order: a
link around the image to an image file, the largest candidate of `srcset` or `<picture>`, a
full-size attribute (`data-zoom-image`, `data-full`, `data-large`, `data-src`), otherwise the
loaded image. When a version does not load as an image — a link ending in `.jpg` that leads to a
page about the file, for instance — the viewer falls back to the next one in that order. The
thumbnail strip uses the picture the page already loaded, or before loading the image's own
source, never the link around it. A `<figcaption>` of the surrounding figure becomes the caption.

### The click

A plain left click on a content image opens the viewer at that image when the image has no link,
links to an image file, or links only to `#…` or `javascript:`. An image linking to another page
keeps its link: a plain click navigates as before. An Alt-click opens any content image, linked or
not, and the page stays where it is. Clicks with Ctrl, Cmd or Shift, the right mouse button and
the middle button are left to the browser.

The image is found under the pointer even when a transparent element lies on top of it, as long
as that element is not a button or form control; a link lying on top counts as the image's link.
When the same picture appears twice on the page, a click on either opens its one gallery entry.

For an image the viewer opens, the page sees neither the click nor the pointer, mouse and touch
presses leading to it, so the site's own lightbox stays closed. Dragging the image and its context
menu keep working.

Swiping stays with the page. When the image sits in a swipe region — a part of the page that
scrolls sideways, snaps while scrolling, handles touch gestures itself, or is built with a known
carousel library — the page receives every press and release, and only the finished click opens
the viewer. A press that moves more than about 10 px before it is released never opens the viewer;
outside a swipe region such a drag opens nothing at all.

The picture grows out of its place on the page and, on closing, shrinks back into the picture the
viewer currently shows, with matching rounded corners; when that picture is off screen, the viewer
fades instead.

## Examples

- An article with a header logo, a round author avatar, three photos and a teaser image linking to
  the next article: clicking the second photo opens "2 / 4"; the logo and avatar do nothing; the
  teaser follows its link but appears as the fourth picture in the gallery.
- A photo with `srcset` offering 400 and 1600 px wide versions opens the 1600 px version.
- A 160 px thumbnail linking to `photo-full.jpg` appears in the gallery as `photo-full.jpg`.
- A photo far down the page that has not loaded yet is already counted in "n / total".
- A share button showing a large picture never opens the viewer.
- A product photo whose site opens its own zoom on `mousedown`: our viewer opens, the site's zoom
  does not.
- A news teaser image linking to the article: a click opens the article; an Alt-click opens the
  viewer with every picture of the front page.
- A Wikipedia article: a click on a photo opens our viewer instead of Wikipedia's media viewer; the
  link to the file page does not load as an image, so the largest picture from the article is shown.
- A photo inside a rich-text editor stays clickable for the editor and never opens the viewer.
- A product page with a swipeable photo carousel: swiping moves to the next photo, a tap on a photo
  opens our viewer.
