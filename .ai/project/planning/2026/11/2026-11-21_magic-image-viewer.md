# Magic Image Viewer — browser extension

## Goal

A browser extension for Chrome and Firefox that opens any content image of any web page in the
lightbox of `@aaix/laravel-islands-gallery` (https://github.com/jonaaix/laravel-islands-gallery,
Vue 3, MIT): zoom at the pointer, pan, pinch, keyboard, slideshow, fullscreen, download. All
content images of the page form one gallery to step through. A site's own lightbox is suppressed
and ours takes over. An image opened directly in a tab is shown in the viewer as well, and a
context-menu entry opens any image in it. The extension is multilingual and will be published
open source on GitHub and in both stores.

Finished when: on the fixture pages and the real-site checklist a click on a content image opens
our viewer with the largest available version, decorative graphics are never picked up, the
site's own lightbox does not open, direct image tabs and the context menu work, the popup can
switch the extension off globally and per site, every string exists in all eight languages, and
both store packages build from CI.

## Milestones

- [x] **M0 — Library release 1.0.9.** In the working copy
  of `laravel-islands-gallery` (its own git repo):
  the five shadow-root changes under Decisions and the thumbnail-ring bug, demo tests green,
  changelog and version bumped, committed locally (`479e2c9`, `9ad4300`). Tag and push only
  after Jonas says so.
- [ ] **M1 — Skeleton and viewer in the page.** WXT + Vue 3 + Tailwind 4, MV3 builds for Chrome
  and Firefox. Content script mounts the library's `Lightbox` inside a Shadow DOM host and opens
  it with a fixed image list on a fixture page. Proves isolation in both directions: page CSS
  does not reach the viewer, viewer CSS does not reach the page. Checks: Tailwind 4 inside a
  shadow root (`@property` rules and `:root` theme variables), `rem` on pages with a changed root
  font size, keyboard events not reaching the page, focus trap, fullscreen, page scroll lock,
  whether `IconButton` from `@aaix/laravel-islands` teleports anything to `body`.
  Built and proven (`cb1abd1`) except the last check, which is M1b.
- [x] **M1b — Tooltips inside the viewer.** `Tooltip` in `@aaix/laravel-islands` takes its
  teleport target from an injected value, `body` when nothing is provided; the gallery's
  `Lightbox` provides its own root when `teleport` is not `body`. Both libraries committed
  locally, no tag, no push. The extension links both from the working copies, the test
  `puts nothing into the page body` passes without the expected-to-fail mark.
- [ ] **M2 — Image detection and click to open.** Collector module finds the content images of a
  page in document order, resolves the largest version of each, reads the list fresh at the
  moment of opening (lazy images that have not loaded yet included), and a click opens the viewer at that image with the grow-from-thumbnail
  animation (`origin`). Pure detection functions with unit tests.
- [ ] **M3 — Taking over site galleries.** Capture-phase interception from `document_start` so
  the site's lightbox never sees the click; linked images handled per the click rule in
  Decisions, including Alt-click; fixture pages for common lightbox patterns and a real-site checklist.
- [ ] **M4 — Direct image tabs and context menu.** An image document (`document.contentType`
  starts with `image/`) is shown in the viewer; context-menu entry "Show in Magic Image Viewer"
  on images opens the viewer on that image, within the page gallery when the image is part of it.
- [ ] **M5 — Popup, settings, languages.** Popup with global on/off and "off on this site";
  all strings through the browser's i18n in en, de, fr, es, it, pt, nl, pl, including the
  library's `labels` and the store description.
- [ ] **M6 — Release readiness.** Icon set, README, MIT licence, privacy statement (no data
  leaves the browser), Playwright end-to-end tests with the extension loaded, CI building both
  store packages, source package for Firefox review.

## State

Library 1.0.9 committed locally, not tagged or pushed. New `Lightbox` prop `teleport`
(`'body'` default, selector or element, `false` renders in place). Demo has `shadow.html` with a
Playwright spec for the shadow-root behaviour.

Extension (own git repo): WXT 0.21 + Vue + Tailwind 4, content script at `document_start`
mounting the viewer lazily on first open in a shadow host appended to `<html>`. Opening is only
reachable through a test hook (`--mode test`, event `magic-image-viewer:test-open`) until M2.
`npm test` builds the test package and runs Playwright in Chromium with the extension loaded
against `tests/fixtures/` (plain, aggressive). Firefox MV3 build loads and opens headless via
WebDriver BiDi; not yet part of `npm test`.

## Decisions

- **Viewer lives in the page inside a Shadow DOM, not in an extension iframe.** Images then load
  with the page's cookies and referrer, so hotlink-protected and logged-in images work, and
  `origin` rectangles match the viewport. Rejected: extension-page iframe — clean isolation, but
  images load from a foreign origin and fail on protected sites.
- **The library gets five backwards-compatible changes upstream, released as a new version**
  (`Lightbox.vue` at v1.0.8), instead of a copy inside the extension:
  1. Teleport target as a prop (line 823, fixed to `body`) — default `body`, a given element, or off.
  2. Focus trap reads the active element from `root.getRootNode()` (line 797), not `document`.
  3. Fullscreen state compares against `root.getRootNode().fullscreenElement` (line 743).
  4. Key handling in the capture phase, stopping handled keys so the page's shortcuts stay quiet
     (line 269, today a bubbling `window` listener).
  5. Download menu's outside-click test uses `event.composedPath()` (line 114); `event.target` is
     retargeted to the shadow host, so every press counts as outside.
  The library's `<style>` blocks and z-index need no change.
- **Keys in the capture phase leave ArrowLeft/Right to a focused slider** (video seek, volume);
  everything else the lightbox handles is stopped at `window` capture.
- **Active thumbnail is marked in white, in both tones** (`Thumbnails.vue` lines 41-42). Jonas
  reported the ring as not visible; in the demo it rendered but sat flush on the picture as a 2px
  line, merging with photos and surfaces of a similar tone. Now `0 0 0 2px white` plus a 1px
  `rgb(0 0 0 / 0.55)` outer edge, also for the focus ring; `il-primary` is gone there.
- **Click rule:** an image without a link, or linking to an image file, opens the viewer on a
  plain click. An image linking to another page keeps its link; the viewer opens by Alt-click or
  the context menu. Rejected: a hover button on the image, and taking over every click.
- **The extension swallows every key event while the viewer is open.** The library stops only the
  keys it handles; on an arbitrary site any other key (`j`, `k`, `f` …) would still trigger the
  page behind the viewer. The content script registers capture listeners on `window` for
  `keydown`, `keyup` and `keypress` at `document_start` and calls `stopPropagation` while the
  viewer is open — not `stopImmediatePropagation`, so the library's own listener on `window`
  still runs. Rejected: widening the library, which serves normal pages where this is unwanted.
- **The library's CSS must be placed in the shadow root by the extension build.** Vite appends
  the library's `<style>` blocks to the page `<head>`; without them in the shadow root the stage
  covers the toolbar and nothing is clickable.
- **Until 1.0.9 is tagged on GitHub the extension links the library from the local working
  copy.** Before publication the dependency becomes `github:jonaaix/laravel-islands-gallery#v1.0.9`.
- **Shadow-root CSS is rewritten at build time** (`build/shadowRootCss.js`, a PostCSS plugin):
  `@property` rules become variable defaults on `:host, *, ::before, ::after, ::backdrop`,
  because `@property` is ignored inside a shadow root and WXT would otherwise move it into the
  page `<head>`; every `rem` becomes px at 16px, because `rem` follows the page's root font size.
  WXT's `:host { all: initial !important }` reset wipes Tailwind's base font, so the UI
  container sets `font-sans leading-normal` itself.
- **Key guard: stop on `window` capture, forward a copy inside.** `stopPropagation` at `window`
  also keeps keys from the viewer's own inner controls (video sliders), so after each open a
  second `window` capture listener, registered after the library's, dispatches a non-composed
  copy to the original target when the library did not handle the key. Stopping on `document`
  was rejected: other listeners on the same node still fire.
- **The host is pinned with inline `!important` styles** (fixed, 0×0, z-index max), which beat
  any page rule including `* { all: unset }`.
- **WXT as the extension framework.** One codebase for Chrome and Firefox MV3, Vite-based like
  the library, with Vue module, shadow-root UI helper and i18n. Rejected: hand-written manifests
  and two build configs.
- **Site galleries are suppressed generically**, by taking the click in the capture phase before
  the page, not by per-site code. Per-site adapters are a later idea.
- **Detection in one module with named thresholds**: an image counts when it is visible and
  rendered at least about 100 px on its shorter side, or when it is a thumbnail linking to an
  image file. Excluded: SVG icons, sprites, tracking pixels, images inside buttons and form
  controls. Largest version from: link to an image file, `srcset`/`<picture>`, common data
  attributes (`data-src`, `data-full`, `data-zoom-image`, `data-large`), else `currentSrc`.
  Thresholds are tuned against the fixtures in M2.
- **Gallery scope: all content images of the page**, in document order.
- **Active on every site by default**, with a global and a per-site switch in the popup.
- **Images only in the first version.** The library plays videos, but page videos are left alone.
- **Tooltips are fixed in the islands library, not switched off in the viewer.** Same line as
  the gallery changes: one generic injected teleport target, default unchanged. Rejected: a
  `tooltips` switch on `Lightbox` — icon-only buttons would lose their hints.
- **Top frame only in the first version.** Images inside iframes are not collected.
- **No telemetry, no remote code, no network requests of our own.** Keeps the store review of
  the all-sites permission simple and the privacy statement one sentence.
- **Languages: en, de, fr, es, it, pt, nl, pl.** English is the fallback.

## Open

- Firefox: content-script host permission under MV3 for a normal (non-temporary) install, and
  whether the backdrop blur renders (missing in headless Firefox).

- To verify in M4: content scripts on `file://` images (Chrome needs the user's "Allow access to
  file URLs"; Firefox behaviour to be checked).
