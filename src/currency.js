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
    const isFlight = /^\/travel\/flights(?:\/|$)/.test(url.pathname);
    const isHotelSearch = /^\/travel\/search\/?$/.test(url.pathname);
    if (url.protocol !== "https:" ||
        !["google.com", "www.google.com"].includes(url.hostname) ||
        !(isFlight || isHotelSearch)) return null;

    const preferred = normalizeCurrency(currency);
    if (isHotelSearch) {
      const currentTs = url.searchParams.get("ts");
      if (currentTs === null) return null;
      const preferredTs = HotelState.withCurrency(currentTs, preferred);
      if (preferredTs === null) return null;
      const current = url.searchParams.getAll("curr");
      if (preferredTs === currentTs && (current.length === 0 ||
          (current.length === 1 && current[0] === preferred))) return null;
      url.searchParams.set("ts", preferredTs);
      if (current.length) url.searchParams.set("curr", preferred);
      return url.href;
    }
    const current = url.searchParams.getAll("curr");
    if (current.length === 1 && current[0] === preferred) return null;
    url.searchParams.set("curr", preferred);
    return url.href;
  }

  return Object.freeze({ defaultCurrency, normalizeCurrency, preferredUrl });
})();
