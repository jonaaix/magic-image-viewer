---
id: viewer-click-to-open
created: 2026-11-21
tags: [viewer, image-detection, gallery]
---

# Opening a page image in the viewer

## What is it for?

On any web page, a click on a picture that is meant to be looked at opens it full screen in the
viewer, where it can be zoomed and panned. The pictures that belong together with it — the
gallery, grid, carousel or article it sits in — form the viewer's gallery, so the visitor can step
through them without going back to the page. Logos, icons, avatars and other decoration never
open.

## How does it work?

### Which images count

An image counts as a content image when it is visible and rendered at least about 100 px on its
shorter side. A smaller image still counts when it is a thumbnail of at least about 40 px that
links to an image file. A lazy image that has no size yet because it has not loaded counts as long
as the page does not hide it. Images inside buttons, form controls or editable content, sprites
and tracking pixels never count. An element that only acts as a button — no native button, no
text of its own, just the picture — is the page's way of opening that picture and does not stop it
from counting, like the main product photo on Amazon. Only the page itself is searched, not embedded frames.

### The gallery

The gallery is the group the opened picture belongs to, found by the page's structure:

- **Siblings of the same shape.** Starting at the picture, the search goes up the page's element
  tree. On each level it compares the part holding the picture with its siblings. A sibling has
  the same shape when it is the same kind of element, leads down to exactly one picture by the same
  path, and shows it at a similar size — about the same width or about the same height, so masonry
  tiles of changing height still match. The innermost level with at least one such sibling is the
  group; other content on that level, such as paragraphs between the figures of an article, stays
  out.
- **Rows and columns join.** The group grows upwards only through containers that hold nothing but
  such items, such as the rows or columns of a grid. A container with a heading or any other content
  ends it, so two galleries in separate sections of a page stay two galleries.
- **The main image of a preview strip.** A picture without a group of its own that shows the large
  version of a grouped picture — the main photo above the thumbnails of a product page — opens that
  group at the matching place.
- **Otherwise alone.** A picture with none of these opens on its own, without a counter.

Opening never waits for the gallery. A click opens the picture at once on its own; right after,
the group is searched on the page as it is at that moment, and the counter and the thumbnail strip
appear while the picture stays where it is. Nothing is worked out in advance, so pictures a page
loads later by script are always part of the next opening.

Pictures of a group count even below the 100 px threshold, down to about 40 px, as long as they
are visible and not sprites or inside controls. It follows the page's order, lists every picture once
— cloned carousel slides included — and includes lazy images that have not loaded yet.

The viewer opens at once with the picture the page has already loaded, at that picture's own size
and never larger than the screen, and loads the largest version behind it; once that has loaded the
picture eases into its size and shape — a square-cropped thumbnail of a wide photo widens, a small
thumbnail grows. The change is always a transition, never a jump. When the largest version never loads, the page's picture stays.

For each picture the viewer shows the largest version the page offers, looked up in this order: a
link around the image to an image file, the largest candidate of `srcset` or `<picture>`, a
full-size attribute (`data-zoom-image`, `data-full`, `data-large`, `data-src`), then the original
read off one of these addresses, otherwise the loaded image. The original is the same address
without its size marker — Amazon's `._AC_SX679_` codes, a `-300x200` suffix, Shopify's `_400x400`
or `_large`, Cloudinary's transformations, the source behind a Next.js image proxy, and `w`, `h`,
`width` and `height` parameters. Two pictures whose addresses lead to the same original show the
same image. When a version does not load as an image — a link ending in `.jpg` that leads to a
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
When the same picture appears twice in a group, a click on either opens its one gallery entry.

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

- An article with a header logo, a round author avatar, three photos in figures between its
  paragraphs and a teaser image linking to the next article: clicking the second photo opens
  "2 / 3"; the logo and avatar do nothing; the teaser follows its link and is not part of the
  photos' gallery.
- A page with two photo galleries under their own headings: each opens only its own photos; a grid
  of several rows opens as one gallery.
- A product page: the main photo and the thumbnails below it open the same gallery.
- A single photo in a text: opens alone, without a counter.
- A photo with `srcset` offering 400 and 1600 px wide versions opens the 1600 px version.
- A 160 px thumbnail linking to `photo-full.jpg` appears in the gallery as `photo-full.jpg`.
- A photo far down a gallery that has not loaded yet is already counted in "n / total".
- A share button showing a large picture never opens the viewer.
- A product photo whose site opens its own zoom on `mousedown`: our viewer opens, the site's zoom
  does not.
- A news teaser image linking to the article: a click opens the article; an Alt-click opens the
  viewer with the other teasers of its kind.
- A Wikipedia article: a click on a photo opens our viewer instead of Wikipedia's media viewer; the
  link to the file page does not load as an image, so the largest picture from the article is shown.
- A photo inside a rich-text editor stays clickable for the editor and never opens the viewer.
- A product page with a swipeable photo carousel: swiping moves to the next photo, a tap on a photo
  opens our viewer.
