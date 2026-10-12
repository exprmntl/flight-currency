const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = (name) => readFileSync(path.join(__dirname, '..', 'src', name), 'utf8');

function harness(href = 'https://www.google.com/travel/flights?hl=en', stored = {}) {
  const callbacks = {};
  const redirects = [];
  let changePreference;
  let resolveRead;
  const read = new Promise(resolve => { resolveRead = resolve; });
  const location = { href, replace(url) { redirects.push(url); this.href = url; } };
  const context = vm.createContext({
    URL, atob, btoa, location,
    window: {
      navigation: { addEventListener: (event, fn) => { callbacks[event] = fn; } },
      addEventListener: (event, fn) => { callbacks[event] = fn; },
    },
    chrome: { storage: {
      sync: { get: () => read },
      onChanged: { addListener: fn => { changePreference = fn; } },
    } },
  });
  vm.runInContext(source('currencies.js') + '\n' + source('hotel-state.js') + '\n' + source('currency.js'), context);
  const api = vm.runInContext('FlightCurrency', context);
  return { api, context, redirects, location, callbacks,
    start: () => vm.runInContext(source('content.js'), context),
    resolve: () => resolveRead(stored),
    change: (value, area = 'sync') => changePreference({ currency: { newValue: value } }, area),
  };
}

test('sets a preference while preserving searches, repeated params, language and fragments', () => {
  const { api } = harness();
  const original = new URL('https://www.google.com/travel/flights/search?tfs=ABC%2B%2F%3D&hl=ja&x=1&x=2#results');
  const changed = new URL(api.preferredUrl(original.href, 'JPY'));
  assert.equal(changed.searchParams.get('curr'), 'JPY');
  changed.searchParams.delete('curr');
  assert.equal(changed.href, original.href);
});

test('correct preference never redirects; duplicate currency parameters are normalized', () => {
  const { api } = harness();
  assert.equal(api.preferredUrl('https://www.google.com/travel/flights?curr=EUR', 'EUR'), null);
  const next = api.preferredUrl('https://www.google.com/travel/flights?curr=USD&curr=EUR', 'EUR');
  assert.deepEqual(new URL(next).searchParams.getAll('curr'), ['EUR']);
  assert.equal(api.preferredUrl(next, 'EUR'), null);
  const hotel = api.preferredUrl('https://www.google.com/travel/search?ts=CAESCgoCCAMKAggDEAAqCQoFOgNCTkQaAA&curr=EUR', 'EUR');
  assert.equal(api.preferredUrl(hotel, 'EUR'), null);
});

test('updates encoded hotel currency without changing other search parameters', () => {
  const { api } = harness();
  for (const href of [
    'https://www.google.com/travel/search?q=boston%20hotels&ts=CAESCgoCCAMKAggDEAAqCQoFOgNCTkQaAA&ved=0CAAQ5JsGahgKEwigl6no14SXAxUAAAAAHQAAAAAQmQE&ictx=3&qs=CAAgASgA&ap=KigKEgl5moIUnwtFQBGCmQDN1NRRwBISCSsCNd5qQkVAEYKZAE0rs1HAMAA',
  ]) {
    const original = new URL(href);
    const changed = new URL(api.preferredUrl(href, 'JPY'));
    assert.match(Buffer.from(changed.searchParams.get('ts'), 'base64url').toString('latin1'), /:\x03JPY/);
    assert.equal(
      Buffer.from(changed.searchParams.get('ts'), 'base64url').toString('latin1'),
      Buffer.from(original.searchParams.get('ts'), 'base64url').toString('latin1').replace('BND', 'JPY')
    );
    assert.equal(changed.searchParams.has('curr'), false);
    assert.equal(api.preferredUrl(changed.href, 'JPY'), null);
    changed.searchParams.set('ts', original.searchParams.get('ts'));
    assert.deepEqual([...changed.searchParams], [...original.searchParams]);
    assert.equal(changed.pathname, original.pathname);
  }
});

test('adds the currency to the empty hotel state from a fresh search', () => {
  const { api } = harness();
  const original = 'https://www.google.com/travel/search?ts=CAESABoAKgIKAA&ved=0CAAQ5JsGahcKEwiQluj224SXAxUAAAAAHQAAAAAQBw&ictx=3';
  const changed = new URL(api.preferredUrl(original, 'USD'));
  assert.match(Buffer.from(changed.searchParams.get('ts'), 'base64url').toString('latin1'), /:\x03USD/);
  assert.equal(changed.searchParams.get('ved'), new URL(original).searchParams.get('ved'));
  assert.equal(api.preferredUrl(changed.href, 'USD'), null);
});

test('leaves an unknown hotel search state untouched', () => {
  const { api } = harness();
  assert.equal(api.preferredUrl('https://www.google.com/travel/search?ts=invalid&x=1', 'JPY'), null);
});

test('never changes unrelated pages or lookalike domains', () => {
  const { api } = harness();
  for (const href of [
    'https://www.google.com/search?q=flights',
    'https://www.google.com/travel',
    'https://www.google.com/travel/explore',
    'https://www.google.com/travel/hotels',
    'https://www.google.com/travel/hotels/Tokyo?ts=CAESABoAKgIKAA',
    'https://www.google.com/travel/hotelsomething',
    'https://www.google.com/travel/search',
    'https://www.google.com/travel/searchsomething',
    'https://www.google.com/travel/search/results',
    'https://www.google.com/travel/flightsomething',
    'https://google.com.evil.test/travel/flights',
    'https://maps.google.com/travel/flights',
    'http://google.com/travel/flights',
    'file:///travel/flights', 'not a URL',
  ]) assert.equal(api.preferredUrl(href, 'EUR'), null, href);
  assert.equal(new URL(api.preferredUrl('https://google.com/travel/flights/', 'GBP')).searchParams.get('curr'), 'GBP');
  assert.equal(api.preferredUrl('https://google.com/travel/search/', 'GBP'), null);
});

test('supports the current 71 currencies and defaults corrupt or missing preferences to USD', () => {
  const { api, context } = harness();
  assert.equal(vm.runInContext('FLIGHT_CURRENCIES.length', context), 71);
  for (const code of ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'NGN', 'AED']) assert.equal(api.normalizeCurrency(code), code);
  for (const value of [undefined, null, {}, 'usd', 'BTC', 'BGN']) assert.equal(api.normalizeCurrency(value), 'USD');
});

test('loads saved preference, updates an open tab, and handles SPA/back navigation without loops', async () => {
  const h = harness(undefined, { currency: 'EUR' });
  h.start(); h.resolve(); await Promise.resolve();
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'EUR');
  h.change('JPY');
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'JPY');
  h.callbacks.currententrychange();
  assert.equal(h.redirects.length, 2);
  h.location.href = 'https://www.google.com/travel/flights/search?tfs=search&curr=USD';
  h.callbacks.currententrychange();
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'JPY');
  h.location.href = 'https://www.google.com/travel/flights?curr=EUR';
  h.callbacks.popstate();
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'JPY');
  h.location.href = 'https://www.google.com/travel/hotels';
  h.change('GBP');
  assert.equal(h.location.href, 'https://www.google.com/travel/hotels');
  h.location.href = 'https://www.google.com/travel/hotels/entity/example?curr=USD';
  h.callbacks.currententrychange();
  assert.equal(h.location.href, 'https://www.google.com/travel/hotels/entity/example?curr=USD');
  h.location.href = 'https://www.google.com/travel/search?ts=CAESCgoCCAMKAggDEAAqCQoFOgNCTkQaAA';
  h.callbacks.currententrychange();
  assert.match(Buffer.from(new URL(h.location.href).searchParams.get('ts'), 'base64url').toString('latin1'), /:\x03GBP/);
  h.location.href = 'https://www.google.com/travel/explore';
  h.callbacks.currententrychange();
  assert.equal(h.location.href, 'https://www.google.com/travel/explore');
  h.location.href = 'https://www.google.com/travel/flights';
  h.callbacks.currententrychange();
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'GBP');
});

test('a late storage read cannot overwrite a newer choice; clearing storage restores USD', async () => {
  const h = harness(undefined, { currency: 'EUR' });
  h.start(); h.change('JPY'); h.resolve(); await Promise.resolve();
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'JPY');
  h.change('CAD', 'local');
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'JPY');
  h.change(undefined);
  assert.equal(new URL(h.location.href).searchParams.get('curr'), 'USD');
});
