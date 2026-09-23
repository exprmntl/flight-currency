/* Only update the currency field observed in Google Hotels' encoded `ts` URL state. */
const HotelState = (() => {
  function readVarint(bytes, start, limit) {
    let value = 0;
    for (let i = start; i < limit && i < start + 10; i++) {
      value += (bytes[i] & 127) * 2 ** (7 * (i - start));
      if (!(bytes[i] & 128) && Number.isSafeInteger(value)) return { value, end: i + 1 };
    }
    return null;
  }

  // Find a single length-delimited protobuf field without decoding its contents.
  function findField(bytes, start, limit, number) {
    let match = null;
    for (let i = start; i < limit;) {
      const tag = readVarint(bytes, i, limit);
      if (!tag || tag.value < 8) return null;
      const wire = tag.value % 8;
      let valueStart = tag.end;
      let end;
      if (wire === 0) {
        const value = readVarint(bytes, valueStart, limit);
        if (!value) return null;
        end = value.end;
      } else if (wire === 1 || wire === 5) {
        end = valueStart + (wire === 1 ? 8 : 4);
      } else if (wire === 2) {
        const length = readVarint(bytes, valueStart, limit);
        if (!length) return null;
        valueStart = length.end;
        end = valueStart + length.value;
      } else return null;
      if (end > limit) return null;
      if (Math.floor(tag.value / 8) === number) {
        if (wire !== 2 || match) return null;
        match = { tagStart: i, start: valueStart, end };
      }
      i = end;
    }
    return match;
  }

  function varint(value) {
    const bytes = [];
    while (value > 127) {
      bytes.push((value % 128) | 128);
      value = Math.floor(value / 128);
    }
    return [...bytes, value];
  }

  function replaceField(bytes, field, number, value) {
    return [
      ...bytes.slice(0, field.tagStart),
      ...varint(number * 8 + 2), ...varint(value.length), ...value,
      ...bytes.slice(field.end),
    ];
  }

  function withCurrency(ts, currency) {
    try {
      const bytes = Array.from(atob(ts.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
      // Observed field path: 5 -> 1 -> 7. Leave unfamiliar state untouched.
      const outer = findField(bytes, 0, bytes.length, 5);
      if (!outer) return null;
      const outerValue = bytes.slice(outer.start, outer.end);
      const inner = findField(outerValue, 0, outerValue.length, 1);
      if (!inner) return null;
      const innerValue = outerValue.slice(inner.start, inner.end);
      const field = findField(innerValue, 0, innerValue.length, 7);
      let updated;
      if (field) {
        if (field.end - field.start !== 3) return null;
        const current = String.fromCharCode(...innerValue.slice(field.start, field.end));
        if (!/^[A-Z]{3}$/.test(current)) return null;
        if (current === currency) return ts;
        updated = [...bytes];
        const offset = outer.start + inner.start + field.start;
        for (let i = 0; i < 3; i++) updated[offset + i] = currency.charCodeAt(i);
      } else {
        // Google's selector creates field 7 when field 1 is empty.
        if (innerValue.length !== 0) return null;
        const code = Array.from(currency, char => char.charCodeAt(0));
        const newOuter = replaceField(outerValue, inner, 1, [0x3a, 3, ...code]);
        updated = replaceField(bytes, outer, 5, newOuter);
      }
      return btoa(updated.map(byte => String.fromCharCode(byte)).join(""))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch { return null; }
  }

  return Object.freeze({ withCurrency });
})();
