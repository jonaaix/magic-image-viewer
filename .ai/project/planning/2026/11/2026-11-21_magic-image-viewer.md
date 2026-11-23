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
  changelog and version bumped. Released as `v1.0.9`.
- [x] **M1 — Skeleton and viewer in the page.** WXT + Vue 3 + Tailwind 4, MV3 builds for Chrome
  and Firefox. Content script mounts the library's `Lightbox` inside a Shadow DOM host and opens
  it with a fixed image list on a fixture page. Proves isolation in both directions: page CSS
  does not reach the viewer, viewer CSS does not reach the page. Checks: Tailwind 4 inside a
  shadow root (`@property` rules and `:root` theme variables), `rem` on pages with a changed root
  font size, keyboard events not reaching the page, focus trap, fullscreen, page scroll lock,
  whether `IconButton` from `@aaix/laravel-islands` teleports anything to `body`.
  The last check became M1b.
- [x] **M1b — Tooltips inside the viewer.** `Tooltip` in `@aaix/laravel-islands` takes its
  teleport target from an injected value, `body` when nothing is provided; the gallery's
  `Lightbox` provides its own root when `teleport` is not `body`. Released as islands `v1.0.176`
  and gallery `v1.0.9`; the test `puts nothing into the page body` passes without the
  expected-to-fail mark.
- [x] **M2 — Image detection and click to open.** Collector module finds the content images of a
  page in document order, resolves the largest version of each, reads the list fresh at the
  moment of opening (lazy images that have not loaded yet included), and a click opens the viewer at that image with the grow-from-thumbnail
  animation (`origin`). Pure detection functions with unit tests. Behaviour in the Feature Book
  chapter `viewer-click-to-open`.
- [x] **M3 — Taking over site galleries.** The site's lightbox never opens for an image we open:
  besides `click`, the pointer, mouse and touch events leading to it are kept from the page
  (propagation only, defaults stay, so dragging an image still works). Click rule from Decisions
  in full: link to an image file opens on a plain click, `href="#"` and `javascript:` links count
  as unlinked, a link to another page keeps navigating, Alt-click opens any content image.
  The image under the pointer is found even when an overlay element covers it. A clicked image
  whose source is already in the list opens at that entry. Images inside editable content are
  left alone. Fixture pages for the common lightbox patterns, a real-site checklist, and the
  first build Jonas loads in his own browser.
- [x] **M3b — Swiping stays with the page.** In a swipe region — an ancestor of the image scrolls
  sideways, uses scroll snap, restricts `touch-action`, or carries the markup of a known carousel
  library — presses and releases reach the page unchanged and only `click` is taken. More than
  `MAX_TAP_DISTANCE` (10 px) between press and click never opens the viewer. Outside swipe
  regions everything stays as in M3. Proven by `carousel.html`: a pointer carousel swipes with
  mouse and touch, a markup-known carousel with the mouse, a tap opens our viewer, a drag across
  a free image opens nothing.
- [x] **M4 — Direct image tabs and context menu.** An image document whose `document.contentType`
  is an image type other than SVG opens the viewer at once with that one image; closing shows the
  browser's view, a click on the image opens the viewer again. Context-menu entry "Show in Magic
  Image Viewer" on images, its text through the browser's i18n from the start (English only until
  M5). When the image is part of the page gallery the viewer opens there at its place, otherwise
  it shows the image alone — decorative images and images in iframes included. Only the
  permissions this needs. `file://` behaviour in Chrome and Firefox settled and recorded here.
  Behaviour in the Feature Book chapter `viewer-open-from-tab-and-menu`.
- [x] **M5 — Popup, settings, languages.** Popup with a global switch and a switch for the
  current host, both live without reload and kept across restarts; a hint instead of the site
  switch on pages extensions cannot reach; version and repository link; light and dark. Firefox:
  a button requests website access when it is missing. Badge on the toolbar icon while off.
  Every string through the browser's i18n in en, de, fr, es, it, pt_BR, pt_PT, nl, pl, including
  the store description, the menu entry, the popup and the library's `labels`. Behaviour in the
  Feature Book chapter `settings-switches`.
- [x] **M6 — Release readiness.** Three icon designs, one built in as the provisional default,
  all sizes plus a grey variant for "off". README with screenshots, MIT `LICENSE`, `PRIVACY.md`
  with a reason per permission, `CHANGELOG.md`. GitHub CI runs unit tests, browser tests and both
  builds on every push; a version tag attaches the Chrome package, the Firefox package and the
  Firefox source package to a GitHub release. Store material in `store/` (listings in every
  language, screenshots, permission justifications) and a release checklist for Jonas. Version
  1.0.0 prepared, not tagged; `main` follows `dev`. Own security check of the whole extension.

## State

Gallery `v1.0.9` and islands `v1.0.176` are tagged on GitHub. New `Lightbox` prop `teleport`
(`'body'` default, selector or element, `false` renders in place). Demo has `shadow.html` with a
Playwright spec for the shadow-root behaviour.

Extension (`github.com/jonaaix/magic-image-viewer`, branches `dev` and `main`): WXT 0.21 + Vue + Tailwind 4, content script at `document_start`
mounting the viewer lazily on first open in a shadow host appended to `<html>`. Opening is only
reachable through a test hook (`--mode test`, event `magic-image-viewer:test-open`) until M2.
`npm test` builds the test package and runs Playwright in Chromium with the extension loaded
against `tests/fixtures/` (plain, aggressive, article, sources). A plain click on an unlinked
content image opens the viewer on the page gallery; `npm run test:unit` covers the rules.
M3: gestures on images we open are taken at `window` capture (`clickToOpen.js`), click rules
in `clickRules.js`, fixture `lightboxes.html` covers the common lightbox patterns. M3b: swipe
regions and the tap distance in the same files, fixture `carousel.html`. Real-site
checklist run headless; rows blocked for automation stay open for Jonas. M4: `imageDocument.js` takes over raster image tabs,
`contextMenu.js` answers the background's menu message (`entrypoints/background.js`), both open
through `galleryOpener.js`. Permission: `contextMenus` only. Locale file `public/_locales/en`.
M5: settings in `utils/settings.js` (`storage.local`), the content script follows them through
`activation.js`, the background toggles the menu and the badge, popup in `entrypoints/popup/`.
Locales in `public/_locales/`, completeness checked by `tests/unit/locales.test.js`. The popup
takes the page address from `?url=` in test builds, since tests open it as a tab. Browser tests
read expected texts from the browser's own language files, so they pass in any system language.
M6: icon variants in `assets/icon/`, rendered by `npm run icons` into `public/icons/` (grey
copies in `off/`); Jonas set the colours himself in the icon studio (`variant-e`; studio and previews in
`.ai/project/artifacts/2026-11-21_icon-*.html`). CI in `.github/workflows/ci.yml`; store material
and the release checklist in `store/`, regenerated by `scripts/store-assets.mjs`. Version 1.0.0
is prepared and not tagged. Builds land in `dist/` (WXT `outDir`).
Specs `imageTab.spec.js` and `menu.spec.js`; the menu click is driven through a test-mode hook in
the service worker, since Playwright cannot click native menus. Firefox MV3 build loads and opens
headless via WebDriver BiDi (image tab and SVG checked there); not yet part of `npm test`.

## Decisions

- **The popup carries status, image count, trust and author links** (Jonas' choice of ten
  elements); quick guide and shortcuts stay out. The coffee link lives only in `utils/links.js`;
  empty hides the button. No new permissions, no network access.
- **A file opened directly in a tab exists only in the viewer.** Image or video, local or from
  the web: the viewer shows it at once and cannot be closed — no close button, Esc only resets
  the zoom, no drag-down, and no "off on this site". The browser's own view never appears; a
  native video underneath is silenced. Only the global switch turns it off, because that switches
  the whole extension off. This replaces the earlier rule that closing shows the browser's view.
  Needs a `closable` prop on the library's `Lightbox`.
- **File tabs show the media immersive** (gallery `immersive` prop): it fills the screen up to a
  narrow edge and the bars float above it, fading when idle. Page galleries keep the reserved space,
  since their thumbnail strip stays visible and would cover the picture.
- **The zoom button toggles actual size** (gallery 1.0.12): fitted → 1:1, any zoom → fitted; an
  image no larger than fitted zooms 2.5×. A click or double tap on the image keeps zooming 2.5×,
  as Jonas asked. The zoom limit rises to 1:1 where that lies above `maxZoom`.
- **Jonas tests before anything is released.** Changes are built into `dist/` for him first;
  pushes of library tags and the tag `v1.0.0` wait for his OK.
- **The viewer sits in the browser's top layer while open** (popover on the shadow host), not
  only at the highest z-index. An ad or widget with the same maximum z-index that comes later in
  the page would otherwise stay above it; the top layer is above every z-index. If the page puts
  something of its own into the top layer afterwards, the viewer moves back to the front. A modal
  dialog the page opens meanwhile still makes the viewer inert; the browser allows no way around it.
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
- **Both libraries come from their GitHub tags** (`github:jonaaix/laravel-islands-gallery#v1.0.9`,
  `github:jonaaix/laravel-islands#v1.0.176`), so a fresh clone builds with `npm ci` alone; a
  library change reaches the extension through a new tag. Islands `v1.0.175` already existed on
  GitHub, so the teleport target shipped as `v1.0.176`.
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
- **Swiping wins over taking a site lightbox's press.** In swipe regions only the finished click
  is taken, and a movement beyond `MAX_TAP_DISTANCE` never opens the viewer anywhere. Price: a
  site lightbox inside a carousel that opens on press may open in addition to ours — rarer and
  less harmful than a carousel that no longer swipes. Outside swipe regions a dragged click is
  swallowed, so neither viewer opens.
- **Gesture takeover is decided per event, not per gesture.** Each of `pointerdown`, `mousedown`,
  `touchstart`, `pointerup`, `mouseup`, `touchend`, `click` re-resolves the image under the point;
  same point, same answer, no state to get stuck. Only `click` is prevented.
- **Source fallback is probed lazily**: only the shown picture and its neighbours are test-loaded,
  so a page of 200 thumbnails linking to file pages does not trigger 200 downloads.
- **Unsized lazy images count**: docs sites lazy-load screenshots without width or height, 0×0
  until loaded (VS Code docs: 1 instead of 26 pictures before this rule).
- **We deliver the store packages, texts and screenshots; Jonas uploads the first version.** The
  stores need his developer accounts. The version tag is set only after his OK; CI then builds the
  packages and, from the second version on, submits them via `wxt submit` to every store whose
  secrets are set (`scripts/submit-stores.sh`). Chrome uses the Web Store API v2 with a service
  account, since v1.1 was shut down in October 2026. Chrome 1.0.0 was submitted by hand on
  2026-11-24 (ID `oonincilgnkpgboibfkinloncibankbc`).
- **Firefox manifest declares `data_collection_permissions: { required: ["none"] }`** with
  `strict_min_version` 140.0: required for new AMO submissions since November 2025, understood from
  Firefox 140.
- **CI fetches the git dependencies over HTTPS.** npm records `github:` dependencies as
  `git+ssh` in the lockfile; the workflow rewrites `ssh://git@github.com/` to HTTPS so no key is
  needed.
- **The context menu's new-tab fallback only opens http, https and file images.**
- **Tailwind scans only declared sources** (`source(none)` plus `@source`). Automatic detection read
  every file of the checkout, so the Firefox reviewer's rebuild from the source package differed.
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
  Thresholds: `MIN_SHORT_SIDE` 100 px, `MIN_LINKED_THUMBNAIL_SIDE` 40 px. Data attributes are
  tried full-size first (`data-zoom-image`, `data-full`, `data-large`, then `data-src`), and the
  srcset step also reads `data-srcset`. SVG files are not excluded by type: small icons fall out
  by size, large SVG content counts. A 1 px placeholder does not count as the loaded source.
- **The collector reads the DOM into plain descriptors** (`collector/describe.js`) and decides on
  them with pure functions (`collector/rules.js`), so the rules run under `node --test` without a
  browser.
- **The viewer opens with the page's own image and loads the largest version behind it.** The
  image already loaded on the page is shown at once and the open animation starts without waiting;
  the largest version replaces it as soon as it has loaded. Rejected: waiting up to 400 ms for the
  largest version before anything is visible (slow on real sites); opening only the page's image
  (thumbnails stay blurred when zoomed).
- **The page's image opens at its own size and grows into the largest version.** Its size is never
  enlarged to the screen, so the switch only ever grows the picture with a transition. Rejected:
  enlarging it to the screen (it shrank back whenever the largest version was smaller than the
  screen); waiting briefly for the largest version's size; keeping the enlarged size.
- **Site adapters for galleries the page structure does not reveal.** An adapter per site
  (`entrypoints/content/adapters/`) answers before the group rules and returns nothing when the
  clicked picture is not its own, so the general rules stay the default. Amazon is the first: it
  reads the `colorImages` list, because the thumbnails there are separate 500 px files that never
  match the main photo. Rejected: tying a lone picture to any nearby thumbnail strip (blurred on
  Amazon, and a foreign strip could join).
- **A lone picture looks for its photo list in the page's scripts.** After the group rules fail,
  the inline scripts are searched for the picture's address; the innermost list around it with at
  least two different photos is the gallery (`collector/embedded.js`). It covers Amazon and Shopify
  without an adapter; adapters stay for sites where it fails. Rejected: clicking the page's own
  thumbnails and watching the result (visible, slow, side effects, only small sizes).
- **The image opens first, its gallery is found afterwards.** On a click the viewer shows the
  one image at once; the group is then searched on the page as it is at that moment and joins the
  open viewer without the picture moving. Nothing is precomputed and nothing is cached, so images
  a page loads later by script are always included. Rejected: working the groups out in idle time
  after load and caching them — it needs invalidation on every page change and can show a stale
  gallery. Only the empty viewer is mounted in the first idle slot after load, so its stylesheet
  is not queued behind the page's image requests.
- **Gallery scope: the group of the opened image**, not the whole page (Jonas, 2026-11-23). Up
  the tree from the image to the innermost level with siblings of the same shape; grows only
  through pure wrappers; a preview strip's main image opens the strip's group; otherwise alone.
  Rules in `feature viewer-click-to-open`. Rejected: all content images of the page — mixed
  unrelated pictures. The popup still counts all content images of the page.
- **Active on every site by default**, with a global and a per-site switch in the popup.
- **Images only in the first version.** The library plays videos, but page videos are left alone.
- **Tooltips are fixed in the islands library, not switched off in the viewer.** Same line as
  the gallery changes: one generic injected teleport target, default unchanged. Rejected: a
  `tooltips` switch on `Lightbox` — icon-only buttons would lose their hints.
- **Top frame only in the first version.** Images inside iframes are not collected. The context
  menu still reaches them: the background always messages the top frame, which shows the frame's
  image alone.
- **Context menu falls back to a new tab.** When the tab has no content script (open before the
  install, or a page scripts cannot reach), the image opens in a new tab beside it, where the image
  tab shows the viewer. Needs no permission beyond `contextMenus`.
- **The menu target is the last right-clicked image** in the top frame when its source matches the
  menu's `srcUrl`, else the first image showing that source.
- **`file://`:** Chrome runs the content script on local files only with "Allow access to file URLs"
  (store installs off by default, unpacked installs on); verified with Chromium unpacked. Firefox
  160 (headless, temporary install) does not run it on `file://`, not even with an explicit
  `file:///*` match. Accepted for the first version.
- **No telemetry, no remote code, no network requests of our own.** Keeps the store review of
  the all-sites permission simple and the privacy statement one sentence.
- **Languages: en, de, fr, es, it, pt_BR, pt_PT, nl, pl.** English is the fallback. Chrome knows
  no plain `pt`, so Portuguese ships in both variants. The language follows the browser; there is
  no language setting of its own. The name stays untranslated.
- **Switch semantics:** "All sites" off stops everything, the context-menu entry included (the
  background removes it). "This site" off stops only the automatic behaviour (clicks, image tabs);
  the context-menu entry still opens the viewer, as it is an explicit request.
- **Settings in `storage.local`**, not `sync`: a per-device choice, and no data leaves the browser.
- **Permissions: `storage`, `activeTab`** added. `activeTab` gives the popup the current page's
  address without `tabs`, also in Firefox when website access is withheld.
- **Badge is set per tab by the content script's report** (no `tabs` permission needed) and
  globally by the background while all sites are off.
- **Firefox add-on ID `magic-image-viewer@jonaaix.github.io`**, needed for a stable extension URL
  and for the store.
- **Rewritten `@property` defaults live in `@layer properties`.** Unlayered they beat every
  Tailwind utility and reset `translate`, `scale` and friends (the switch knob sat off-centre).

## Open

- Firefox and Edge: first upload by hand (v1.0.0 is tagged and released), then store secrets.

- Firefox: whether the backdrop blur renders (missing in headless Firefox). Website access: granted
  at a temporary install, can be withdrawn; the popup then offers the button (checked headless).