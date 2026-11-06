# Provider icons

The web app uses each reader's own icon. This changes only presentation; the reusable core still parses and generates links entirely offline.

| Reader       | Official source                     | Delivery                                                          |
| ------------ | ----------------------------------- | ----------------------------------------------------------------- |
| Official PTT | https://images.ptt.cc/favicon.svg   | Direct remote image                                               |
| BePTT        | https://beptt.tw/img/beptt.png      | Original PNG bundled at `apps/web/src/assets/providers/beptt.png` |
| PTTweb       | https://www.pttweb.cc/favicon_P.ico | Direct remote image                                               |
| MoPTT        | https://moptt.tw/favicon-96x96.png  | Direct remote image                                               |
| NextPTT      | https://nextptt.app/favicon.ico     | Direct remote image                                               |

Sources were inspected on November 6, 2026 (Asia/Taipei). Official PTT, BePTT, PTTweb, and MoPTT declare these assets in their own HTML; NextPTT serves its own nPTT favicon at the standard favicon URL. The BePTT PNG is the unmodified 512px original, identified by its official home page as the app icon. These are third-party brand assets belonging to their respective owners; they are not original artwork covered by this project's MIT license. Source availability is not a license grant.

Four remote images were decoded successfully from a separate HTTPS origin in Chromium. BePTT's image returned HTTP 403 with a third-party Referer and HTTP 200 with its own Referer or no Referer. A normal cross-site browser image request also failed. This supports a Referer-based hotlink restriction; it does not establish the site's complete Origin or CORS policy. The selected approach bundles the public official BePTT image instead of depending on an omitted Referer to load it remotely.

Remote icon requests use `referrerpolicy="no-referrer"` so the app does not send its page URL to those four hosts. Images retain their original colors and aspect ratios inside a fixed 42px square. They are decorative because the adjacent reader name already supplies the accessible label.

If any image request fails, its original bundled geometric mark replaces the image. A reload retries the official image. Conversion, reader order, visibility, default selection, and link actions do not wait for icon requests. The app remains usable offline; official remote images are not precached and may be replaced by fallbacks. The bundled BePTT image is included in the existing PWA asset precache. No favicon proxy, cross-origin credentials API, or network request is added to the reusable core.
