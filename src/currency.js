/* Shared by the isolated content script and the popup. No page data is collected. */
const FlightCurrency = (() => {
  const defaultCurrency = "USD";
  const supported = new Set(FLIGHT_CURRENCIES.map(([code]) => code));

  function normalizeCurrency(value) {
    return supported.has(value) ? value : defaultCurrency;
  }

  function preferredUrl(href, currency) {
    let url;
    try { url = new URL(href); } catch { return null; }
    if (url.protocol !== "https:" ||
        !["google.com", "www.google.com"].includes(url.hostname) ||
        !/^\/travel\/flights(?:\/|$)/.test(url.pathname)) return null;

    const preferred = normalizeCurrency(currency);
    const current = url.searchParams.getAll("curr");
    if (current.length === 1 && current[0] === preferred) return null;
    url.searchParams.set("curr", preferred);
    return url.href;
  }

  return Object.freeze({ defaultCurrency, normalizeCurrency, preferredUrl });
})();
