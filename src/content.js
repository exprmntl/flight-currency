(() => {
  let currency;
  let preferenceChanged = false;

  function applyCurrency() {
    if (currency === undefined) return;
    const destination = FlightCurrency.preferredUrl(location.href, currency);
    if (destination) location.replace(destination);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.currency) return;
    preferenceChanged = true;
    currency = FlightCurrency.normalizeCurrency(changes.currency.newValue);
    applyCurrency();
  });

  // Navigation API covers Google's history.pushState/replaceState transitions.
  window.navigation?.addEventListener("currententrychange", applyCurrency);
  window.addEventListener("popstate", applyCurrency);
  window.addEventListener("pageshow", applyCurrency);

  chrome.storage.sync.get("currency").then((stored) => {
    // Do not overwrite a newer preference with an in-flight initial read.
    if (!preferenceChanged) currency = FlightCurrency.normalizeCurrency(stored.currency);
    applyCurrency();
  }).catch(() => {
    // Leave Flights usable if Chrome cannot read extension storage.
  });
})();
