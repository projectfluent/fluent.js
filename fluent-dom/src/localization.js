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

export class Localization {
  constructor(id, resIds, generateContexts) {
    this.id = id;
    this.resIds = resIds;
    this.ctxs = generateContexts(resIds);
  }

  async formatWithFallback(keys, method) {
    let translations = [];
    for (let o of this.ctxs) {
      let ctx = await o.ready();
      const errors = keysFromContext(method, ctx, keys, translations);
      if (!errors) {
        break;
      }
    }
    return translations;
  }

  formatEntities(keys) {
    return this.formatWithFallback(keys, messageFromContext);
  }


  formatValues(...keys) {
    const keyTuples = keys.map(
      key => Array.isArray(key) ? key : [key, null]
    );
    return this.formatWithFallback(keyTuples, valueFromContext);
  }

  formatValue(id, args) {
    return this.formatValues([id, args]).then(
      ([val]) => val
    );
  }
}

function valueFromContext(ctx, errors, id, args) {
  const message = ctx.messages.get(id);

  if (message === undefined) {
    errors.push(new L10nError(`Unknown entity: ${id}`));
    return id;
  }

  return ctx.format(message, args, errors);
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
    for (let attrName in msg.attrs) {
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
      if (typeof console !== "undefined") {
        messageErrors.forEach(error => console.warn(error));
      }
    }
  });

  return hasErrors;
}
