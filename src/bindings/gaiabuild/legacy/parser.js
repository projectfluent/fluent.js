import { L10nError } from '../../../lib/errors';

const MAX_PLACEABLES = 100;

export default {
  patterns: null,
  entryIds: null,

  init: function() {
    this.patterns = {
      comment: /^\s*#|^\s*$/,
      entity: /^([^=\s]+)\s*=\s*(.*)$/,
      multiline: /[^\\]\\$/,
      index: /\{\[\s*(\w+)(?:\(([^\)]*)\))?\s*\]\}/i,
      unicode: /\\u([0-9a-fA-F]{1,4})/g,
      entries: /[^\r\n]+/g,
      controlChars: /\\([\\\n\r\t\b\f\{\}\"\'])/g,
      placeables: /\{\{\s*([^\s]*?)\s*\}\}/,
    };
  },

  parse: function(emit, source) {
    if (!this.patterns) {
      this.init();
    }

    const ast = [];
    this.entryIds = Object.create(null);

    const entries = source.match(this.patterns.entries);
    if (!entries) {
      return ast;
    }
    for (let i = 0; i < entries.length; i++) {
      let line = entries[i];

      if (this.patterns.comment.test(line)) {
        continue;
      }

      while (this.patterns.multiline.test(line) && i < entries.length) {
        line = line.slice(0, -1) + entries[++i].trim();
      }

      const entityMatch = line.match(this.patterns.entity);
      if (entityMatch) {
        try {
          this.parseEntity(entityMatch[1], entityMatch[2], ast);
        } catch (e) {
          if (emit) {
            emit('parseerror', e);
          } else {
            throw e;
          }
        }
      }
    }
    return ast;
  },

  parseEntity: function(id, value, ast) {
    let name, key;

    const pos = id.indexOf('[');
    if (pos !== -1) {
      name = id.substr(0, pos);
      key = id.substring(pos + 1, id.length - 1);
    } else {
      name = id;
      key = null;
    }

    const nameElements = name.split('.');

    if (nameElements.length > 2) {
      throw new L10nError('Error in ID: "' + name + '".' +
          ' Nested attributes are not supported.');
    }

    let attr;
    if (nameElements.length > 1) {
      name = nameElements[0];
      attr = nameElements[1];

      if (attr[0] === '$') {
        throw new L10nError('Attribute can\'t start with "$"', id);
      }
    } else {
      attr = null;
    }

    this.setEntityValue(name, attr, key, this.unescapeString(value), ast);
  },

  setEntityValue: function(id, attr, key, rawValue, ast) {
    let pos, v;

    const value = rawValue.indexOf('{{') > -1 ?
      this.parseString(rawValue) : rawValue;

    if (attr) {
      pos = this.entryIds[id];
      if (pos === undefined) {
        v = {$i: id};
        if (key) {
          v[attr] = {$v: {}};
          v[attr].$v[key] = value;
        } else {
          v[attr] = value;
        }
        ast.push(v);
        this.entryIds[id] = ast.length - 1;
        return;
      }
      if (key) {
        if (typeof(ast[pos][attr]) === 'string') {
          ast[pos][attr] = {
            $x: this.parseIndex(ast[pos][attr]),
            $v: {}
          };
        }
        ast[pos][attr].$v[key] = value;
        return;
      }
      ast[pos][attr] = value;
      return;
    }

    // Hash value
    if (key) {
      pos = this.entryIds[id];
      if (pos === undefined) {
        v = {};
        v[key] = value;
        ast.push({$i: id, $v: v});
        this.entryIds[id] = ast.length - 1;
        return;
      }
      if (typeof(ast[pos].$v) === 'string') {
        ast[pos].$x = this.parseIndex(ast[pos].$v);
        ast[pos].$v = {};
      }
      ast[pos].$v[key] = value;
      return;
    }

    // simple value
    ast.push({$i: id, $v: value});
    this.entryIds[id] = ast.length - 1;
  },

  parseString: function(str) {
    const chunks = str.split(this.patterns.placeables);
    const complexStr = [];

    const len = chunks.length;
    const placeablesCount = (len - 1) / 2;

    if (placeablesCount >= MAX_PLACEABLES) {
      throw new L10nError('Too many placeables (' + placeablesCount +
                          ', max allowed is ' + MAX_PLACEABLES + ')');
    }

    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].length === 0) {
        continue;
      }
      if (i % 2 === 1) {
        complexStr.push({t: 'idOrVar', v: chunks[i]});
      } else {
        complexStr.push(chunks[i]);
      }
    }
    return complexStr;
  },

  unescapeString: function(str) {
    if (str.lastIndexOf('\\') !== -1) {
      str = str.replace(this.patterns.controlChars, '$1');
    }
    return str.replace(this.patterns.unicode,
      (match, token) => String.fromCodePoint(parseInt(token, 16))
    );
  },

  parseIndex: function(str) {
    const match = str.match(this.patterns.index);
    if (!match) {
      throw new L10nError('Malformed index');
    }
    if (match[2]) {
      return [{t: 'idOrVar', v: match[1]}, match[2]];
    } else {
      return [{t: 'idOrVar', v: match[1]}];
    }
  }
};
