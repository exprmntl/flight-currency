# Verification — 2026-09-16

- Published store package inspected: Manifest V3, version 0.1.0, static USD redirect rule. GitHub master only had V2 source; no remote branches/tags containing V3.
- Six Node tests pass: search/query/hash preservation, duplicate currency normalization, no redirect loop, exact URL scoping, all 71 current currencies, corrupt/default preferences, storage initialization race, changes in existing tabs, and simulated same-document/back navigation.
- Loaded unpacked `src/` into the user's Chrome profile. Test extension pinned. Published USD-only extension `nameliafoadmpledepdbcgnogcnfiemo` remains installed but disabled to avoid conflicts.
- Actual popup: USD default; selected EUR, saw Saved · EUR. Reopened popup: EUR persisted.
- Actual Flights: euro price cards, then Japanese yen price cards, matched selected currency.
- Opened a New York–London search and changed JPY to USD; `tfs`, `tfu`, and `hl` query parameters remained unchanged.
- Fresh navigation with `curr=CAD` was corrected to saved USD.
- User test preference left at USD. Test Flights tab left available.
- General Sans displayed in popup. Native keyboard-accessible select, associated label/help, live save/error status.
- Not exhaustively tested: every one of the 71 currencies, Chrome sync across multiple devices, Chrome restart, release upgrade through Web Store.

## Store draft and release coordination

- Uploaded version 1.1.0 and verified the dashboard shows draft 1.1.0 separately from published 0.1.0. Status explicitly says “This draft is unpublished.” No review submission or publication was performed.
- Saved title and summary from the package; replaced the description with `store-description.txt`, removed both obsolete screenshots, and uploaded the lighter-subtitle multi-currency screenshot and promo tile.
- Added homepage https://experimental.software and support https://github.com/alexanderqchen/google-flights-currency/issues. Saved single-purpose/storage/host-permission explanations and reviewer instructions. Existing no-collection declarations and no-remote-code declaration remain accurate. GA4 remains off.
- The old public privacy policy at FreePrivacyPolicy.com inaccurately describes generic personal/usage-data collection. Its live URL was left unchanged. A replacement is prepared in the website PR at `src/app/flight-currency/privacy/page.tsx`; after it is publicly available, change the store draft policy URL to https://experimental.software/flight-currency/privacy before submission.
- Website card artwork/name/copy are prepared for the new release in existing website PR #15. Coordinate publication; the extension feature is not live yet.

## Packaging follow-up — 2026-09-16

Version 1.1.1 removes the decorative top-right arrow in the popup and replaces the emoji icon with a ticket-and-exchange SVG exported at all Chrome sizes. Currency logic is unchanged. The selected third promotional graphic (lighter “for Google Flights”) remains in the store draft and website PR. The new privacy page is prepared at `/flight-currency/privacy` in the existing website; it must be live before store review submission.

Verified version 1.1.1 in the user's Chrome: new ticket icon, no decorative headline arrow, saved USD preference retained. Uploaded 1.1.1 and replaced the separate store-listing icon. The privacy URL in the draft is now https://experimental.software/flight-currency/privacy. The page is available on the website PR preview and must reach production before the store update is submitted. Website typecheck, focused lint, and Vercel preview build passed. Neither the website PR nor the store release was published.

## Icon size and privacy alignment follow-up — 2026-09-16

Version 1.1.2 removes the icon's dark outer padding. The acid ticket fills the canvas, with transparent semicircular edge cutouts and larger exchange arrows. Exported and checked the 16, 32, 48, and 128-pixel PNGs. Reloaded the installed unpacked extension in Chrome; version 1.1.2 and the retained USD preference were verified. All six Node tests pass. Uploaded package 1.1.2 and replaced the separate store icon; the dashboard confirmed “Item saved” and draft 1.1.2 alongside published 0.1.0. No review submission was made.

The privacy page header and footer now use the same text width as the body. Website PR #15 preview built successfully; browser measurements confirmed identical left and right content edges for the header, main, and footer. The website PR remains unmerged.

## Separate store and browser icons — 2026-09-16

Version 1.1.3 restores the black-background primary icon for the Chrome Store, privacy page, and extension-management screens. The toolbar and Extensions dropdown retain the expanded acid icon through `action.default_icon`. Checked ZIP contents byte-for-byte against the approved versions of both icon sets. Reloaded local version 1.1.3 and visually checked the toolbar and Extensions dropdown. Restored and saved the store-listing icon separately; confirmed draft 1.1.3 alongside published 0.1.0. No review submission. The website PR preview built successfully and shows the restored black-background privacy-page icon; the PR remains unmerged.

## Release readiness

Version 1.1.3 passes all six Node tests. The final store description uses a comma-separated currency list, explains the travel problem, and omits the former-name paragraphs and product-credit line. The production privacy-policy route must be reachable before Chrome Web Store submission.
