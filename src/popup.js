const select = document.querySelector("#currency");
const status = document.querySelector("#status");
let savedCurrency = FlightCurrency.defaultCurrency;

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function showSaved() {
  showStatus(`Saved · ${savedCurrency}`);
}

async function initialize() {
  select.replaceChildren(...FLIGHT_CURRENCIES.map(([code, name]) => new Option(`${code} — ${name}`, code)));
  try {
    const stored = await chrome.storage.sync.get("currency");
    savedCurrency = FlightCurrency.normalizeCurrency(stored.currency);
    select.value = savedCurrency;
    showStatus(stored.currency === savedCurrency ? `Saved · ${savedCurrency}` : `Default · ${savedCurrency}`);
  } catch {
    select.value = savedCurrency;
    showStatus("Couldn't load your preference. Choose a currency to retry.", true);
  }
  select.disabled = false;
}

select.addEventListener("change", async () => {
  const nextCurrency = FlightCurrency.normalizeCurrency(select.value);
  select.disabled = true;
  showStatus("Saving…");
  try {
    await chrome.storage.sync.set({ currency: nextCurrency });
    savedCurrency = nextCurrency;
    showSaved();
  } catch {
    select.value = savedCurrency;
    showStatus("Couldn't save. Please try again.", true);
  } finally {
    select.disabled = false;
    select.focus();
  }
});

initialize();
