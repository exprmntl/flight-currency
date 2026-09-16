# Flight Currency for Google Flights

A tiny Manifest V3 extension that keeps Google Flights in your preferred currency. Choose from the 71 currencies in Google's current selector. Changes save automatically and apply to open Flights tabs and future visits. USD remains the default.

## Develop

No dependencies, framework, bundler, service worker, or independent background network requests.

1. Obtain the official General Sans font: `python3 scripts/prepare-font.py`.
2. Open `chrome://extensions`, enable Developer mode, and load `src/` unpacked.
3. Disable the published USD-only extension while testing to avoid conflicting behavior.
4. Pin Flight Currency, open the popup, and select a currency.

The font is embedded locally in the extension, ignored by Git, and pinned by SHA-256. Its official license permits embedding in our own applications; see `src/fonts/LICENSE.txt`. It is not offered as an authoring tool or a standalone font download.

## Test and package

`npm test` runs Node's built-in test runner. `npm run package` writes a deterministic ZIP to `dist/` containing only `src/` runtime assets. Node 22+ and Python 3 are used for development; the extension itself has no dependencies.

Before a release, verify popup persistence, a fresh visit, an already-open Flights tab, a real search, Back/Forward, and a non-Flights Google Travel page. Upload the ZIP as a Web Store draft; submitting for review is a separate action.

## Implementation and privacy

- `currencies.js`: currency names and codes, verified against the live Google Flights selector on 2026-09-16. Compared with the old list, BGN was removed and NGN added.
- `currency.js`: validates preferences and changes only the `curr` URL parameter on the exact `google.com` / `www.google.com` Flights paths. Search and language settings are preserved.
- `content.js`: runs at document start and listens for Chrome storage updates and same-document Navigation API events. It runs on Google Travel paths to handle navigation into Flights; it changes only Flights URLs. Correct URLs are left untouched, and replacements do not add history entries.
- `popup.*`: native dropdown, automatic saving, accessible status and error states; General Sans Regular and White Room colors.

Only the currency code is saved in `chrome.storage.sync`. Chrome may sync it between browsers signed into the same account when Chrome sync is enabled. We collect no personal data, browsing history, or search details. There is no analytics, advertising, remote code, or backend. No network interception, `tabs`, or browsing-history permission is used.

The extension sets Google's display currency; it does not convert prices independently or control the currency charged by airlines or booking sites. Google controls available currencies. Existing Flights tabs must be refreshed once after initially loading the unpacked build.

## Source reconciliation

GitHub `master` at `b2bb90d` contained Manifest V2 source and a V2 ZIP, with no other branches or tags. The published Chrome Web Store package was already **Manifest V3, version 0.1.0**, using a static `declarativeNetRequest` USD rule. Its two source files are preserved in `docs/published-0.1.0/` for reference. Version 1.1.0 replaces both stale implementations with the currency picker.

The current source is version 1.1.3. Its Chrome Web Store update is prepared as an unpublished draft; the live store version is still 0.1.0. Store review and production release are separate from this source update.
