'use strict';

import { Context } from '../../../lib/context';
import { format } from './resolver';

export function LegacyContext(env, resIds) {
  Context.call(this, env, resIds);
}

LegacyContext.prototype = Object.create(Context.prototype);

LegacyContext.prototype._formatTuple = function(lang, args, entity, id, key) {
  try {
    return format(this, lang, args, entity);
  } catch (err) {
    err.id = key ? id + '::' + key : id;
    err.lang = lang;
    this._env.emit('resolveerror', err, this);
    return [{ error: err }, err.id];
  }
};
