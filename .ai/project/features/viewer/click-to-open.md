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
links to an image file. Images inside buttons and form controls, sprites and tracking pixels never
count. Only the page itself is searched, not embedded frames.

### The gallery

The list is read fresh at the moment of opening, so images the page added since the last opening
are included. It follows the page's order, lists every picture once, and includes lazy images that
have not loaded yet.

For each picture the viewer shows the largest version the page offers, looked up in this order: a
link around the image to an image file, the largest candidate of `srcset` or `<picture>`, a
full-size attribute (`data-zoom-image`, `data-full`, `data-large`, `data-src`), otherwise the
loaded image. The thumbnail strip uses the picture the page already loaded. A `<figcaption>` of the
surrounding figure becomes the caption.

### The click

A plain left click on a content image without a link opens the viewer at that image. The picture
grows out of its place on the page and, on closing, shrinks back into the picture the viewer
currently shows, with matching rounded corners; when that picture is off screen, the viewer fades
instead. The page does not see the click.

Images inside a link keep their link and are part of the gallery, but a plain click on them is
not taken over yet; how they open is described with the takeover of site galleries.

## Examples

- An article with a header logo, a round author avatar, three photos and a teaser image linking to
  the next article: clicking the second photo opens "2 / 4"; the logo and avatar do nothing; the
  teaser follows its link but appears as the fourth picture in the gallery.
- A photo with `srcset` offering 400 and 1600 px wide versions opens the 1600 px version.
- A 160 px thumbnail linking to `photo-full.jpg` appears in the gallery as `photo-full.jpg`.
- A photo far down the page that has not loaded yet is already counted in "n / total".
- A share button showing a large picture never opens the viewer.
