# Provider order

Factory order: **Official PTT, BePTT, PTTweb, MoPTT, NextPTT**. Official PTT stays first by product decision. Alternatives prioritize low advertising and distraction, then usable sharing previews. This is a curated default, not an automatic score or a promise that every social platform renders a card.

The web app preserves saved order, visibility, and default reader. A newly added provider is appended to a saved order. Changing the factory order does not migrate existing preferences or move the selected default reader.

## Observations on November 6, 2026 (Asia/Taipei)

The same [Stock article](https://www.ptt.cc/bbs/Stock/M.1793932432.A.A03.html) was fetched without cookies from all five readers. Desktop Chromium was used without an ad blocker; MoPTT and PTTweb were also inspected at a 390px viewport. Advertising varies by time, location, viewport, and session, so slot counts are not a long-term advertising ranking.

| Reader                                                               | Sharing metadata for this article                                                                                                       | Observed reading friction                                                                                                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Official PTT](https://www.ptt.cc/bbs/Stock/M.1793932432.A.A03.html) | Article title and description; no declared OG image                                                                                     | Direct article route; restricted boards may require age confirmation                                                                                    |
| [BePTT](https://bbs.beptt.tw/Stock/M.1793932432.A.A03)               | Article title, description, OG image, and large-image Twitter Card; image returned HTTP 200. OG URL and canonical point to Official PTT | Launch/redirect landing page with a five-second default delay; desktop navigation reached Official PTT. No ad slot observed in the fetched landing HTML |
| [PTTweb](https://www.pttweb.cc/bbs/Stock/M.1793932432.A.A03)         | Article title, description, type, self URL, OG image, and summary Twitter Card; image returned HTTP 200                                 | Direct reading; two nonzero-height ad slots observed on desktop                                                                                         |
| [MoPTT](https://moptt.tw/p/Stock.M.1793932432.A.A03)                 | Article title, description, type, and self URL; declared OG thumbnail endpoint returned HTTP 404; no explicit Twitter Card              | Direct reading; a sidebar advertisement and Facebook panel observed on desktop                                                                          |
| [NextPTT](https://nextptt.app/boards/Stock/post/M.1793932432.A.A03)  | Article title and description, and large-image Twitter Card; no declared OG or Twitter image                                            | A large recommendation advertisement appeared before the article body, with additional advertising slots                                                |

HTTP requests using Facebook, Twitterbot, Slackbot, and Discordbot user-agent strings returned HTTP 200 and equivalent metadata for this Stock sample. These requests originated from one local network; they do not establish how the platforms' real crawler IPs, caches, policies, or user settings behave. No Facebook, Threads, X, Slack, or Discord post was published or actual platform card verified. Threads was not independently probed.

A second [Gossiping article](https://www.ptt.cc/bbs/Gossiping/M.1793929702.A.4E4.html) was fetched from all five readers. Official PTT returned article metadata in raw HTML but used JavaScript to send a fresh browser to age confirmation. This is evidence of browser friction, not proof that all preview crawlers receive only an age gate. NextPTT again had no declared preview image. BePTT and PTTweb also had no OG image on that second sample, so image availability is article-dependent.

## Rechecking

Inspect the initial HTML rather than relying only on metadata inserted after JavaScript runs. The [Open Graph specification](https://ogp.me/) defines title, type, image, and URL as its basic properties. Check that titles and descriptions describe the article, that image URLs return an image response, and that canonical URLs, redirects, and age/login gates do not interfere with sharing.

For example, compare the article response and its advertised thumbnail endpoint:

```sh
curl -L --max-time 20 -A 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)' 'https://moptt.tw/p/Stock.M.1793932432.A.A03'
curl -L --max-time 20 -o /dev/null -w '%{http_code} %{content_type}\n' 'https://moptt.tw/p/Stock.M.1793932432.A.A03/t'
```

Recheck multiple articles, including articles with and without images, and desktop/mobile layouts before changing the default order. Actual platform compatibility requires observing each platform's rendered card separately; metadata inspection alone is insufficient. These checks are development research and do not add network access to the offline converter.

## Release compatibility check

Paste one ordinary-board article and one restricted-board article into the
deployed converter. Open all five generated links in a fresh desktop browser
profile. Compare the board, article ID, and title, and record whether each
reader displays the article, redirects to another reader, requests age
confirmation, reports a missing mirror, or blocks access. Inspect the redirect
target or confirmation page's return path before classifying a redirect as a
broken adapter. A mirror can retain an older title, so compare the article ID
and body before concluding that it points to a different post.

On November 9, 2026 (Asia/Taipei), Chromium checked the
[Stock sample](https://www.ptt.cc/bbs/Stock/M.1793932432.A.A03.html) and the
[Gossiping board-rules sample](https://www.ptt.cc/bbs/Gossiping/M.1771671779.A.6ED.html).

| Reader       | Stock sample                             | Gossiping sample                                     |
| ------------ | ---------------------------------------- | ---------------------------------------------------- |
| Official PTT | Opened the article                       | Age confirmation with the article as the return path |
| BePTT        | Matching landing page, then Official PTT | Matching landing page, then Official PTT's age gate  |
| PTTweb       | Opened the article                       | Opened the article                                   |
| MoPTT        | Opened the article                       | Opened the article                                   |
| NextPTT      | Opened the article route                 | Opened the article route                             |

These observations cover the two sample articles and Chromium's desktop flow.
Reader availability and mirror coverage vary. Keep this check outside the
converter so conversion works offline and CI remains independent of reader
uptime.
