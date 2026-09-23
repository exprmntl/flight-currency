# Flight Currency privacy

Flight Currency saves a single preferred currency code using Chrome's built-in `storage.sync` API. Chrome may synchronize this preference between browsers signed into the same account when browser sync is enabled.

The extension checks Google Flights and Hotels URLs and changes their currency setting on your device. Outside Google’s normal page requests and Chrome’s built-in preference sync, it makes no network requests. Experimental Software does not receive travel searches, browsing history, personal information, or the chosen currency. There are no analytics, ads, accounts, remote code, or servers operated for this extension.

The content script is limited to Google Travel pages so it can detect navigation into Google Flights and Hotels. It changes only Flights and Hotels URLs. The `storage` permission saves the selected currency.

Google Flights, Google Hotels, and Chrome are subject to Google's own privacy policies. Flight Currency is not affiliated with Google.
