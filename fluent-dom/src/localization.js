/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global console */

class L10nError extends Error {
  constructor(message, id, lang) {
    super();
    this.name = 'L10nError';
    this.message = message;
    this.id = id;
    this.lang = lang;
  }
}

/**
 * This allows us to cache generated contexts, so that we can generate
 * them lazily, but then cache them and reuse if we have to retrieve
 * more entries from that fallback context.
 */

export default class Localization {
  constructor(id, resIds, generateMessage) {
    this.id = id;
    this.resIds = resIds;
    this.ctxs = generateMessage(resIds);
  }

  async formatWithFallback(keys, method) {
    const translations = [];
    for (const o of this.ctxs) {
      const ctx = await o.ready();
      const errors = keysFromContext(method, ctx, keys, translations);
      if (!errors) {
        break;
      }
    }
    return translations;
  }

  formatMessages(keys) {
    return this.formatWithFallback(keys, messageFromContext);
  }

  async formatValue(id, args) {
    const [val] = await this.formatValues([id, args]);
    return val;
  }
}

function messageFromContext(ctx, errors, id, args) {
  const msg = ctx.messages.get(id);

  if (msg === undefined) {
    errors.push(new L10nError(`Unknown message: ${id}`));
    return { value: id, attrs: null };
  }

  const formatted = {
    value: ctx.format(msg, args, errors),
    attrs: null,
  };

  if (msg.attrs) {
    formatted.attrs = [];
    for (const attrName in msg.attrs) {
      const formattedAttr = ctx.format(msg.attrs[attrName], args, errors);
      if (formattedAttr !== null) {
        formatted.attrs.push([
          attrName,
          formattedAttr
        ]);
      }
    }
  }

  return formatted;
}

function keysFromContext(method, ctx, keys, translations) {
  const messageErrors = [];
  let hasErrors = false;

  keys.forEach((key, i) => {
    if (translations[i] !== undefined) {
      return;
    }

    messageErrors.length = 0;
    const translation = method(ctx, messageErrors, key[0], key[1]);

    if (messageErrors.length === 0) {
      translations[i] = translation;
    } else {
      hasErrors = true;
      if (typeof console !== 'undefined') {
        messageErrors.forEach(error => console.warn(error));
      }
    }
  });

  return hasErrors;
}
