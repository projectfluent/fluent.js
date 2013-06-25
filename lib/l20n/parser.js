if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;

  function Parser(throwOnErrors) {

    /* Public */

    this.parse = parse;
    this.parseString = parseString;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    /* Private */

    var MAX_PLACEABLES = 100;

    var _source, _index, _length, _emitter;

    var getLOL;
    if (throwOnErrors) {
      getLOL = getLOLPlain;
    } else {
      _emitter = new EventEmitter();
      getLOL = getLOLWithRecover;
    }

    function getComment() {
      _index += 2;
      var start = _index;
      var end = _source.indexOf('*/', start);
      if (end === -1) {
        throw error('Comment without closing tag');
      }
      _index = end + 2;
      return {
        type: 'Comment',
        content: _source.slice(start, end)
      };
    }

    function getAttributes() {
      var attrs = [];
      var attr, ws1, ch;
 
      while (true) {
        attr = getKVPWithIndex('Attribute');
        attr.local = attr.key.name.charAt(0) === '_';
        attrs.push(attr);
        ws1 = getRequiredWS();
        ch = _source.charAt(_index);
        if (ch === '>') {
          break;
        } else if (!ws1) {
          throw error('Expected ">"');
        }
      }
      return attrs;
    }

    function getKVP(type) {
      var key = getIdentifier();
      getWS();
      if (_source.charAt(_index) !== ':') {
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: type,
        key: key,
        value: getValue()
      };
    }

    function getKVPWithIndex(type) {
      var key = getIdentifier();
      var index = [];

      if (_source.charAt(_index) === '[') {
        ++_index;
        getWS();
        index = getItemList(getExpression, ']');
      }
      getWS();
      if (_source.charAt(_index) !== ':') {
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: type,
        key: key,
        value: getValue(),
        index: index
      };
    }

    function getHash() {
      ++_index;
      getWS();
      if (_source.charAt(_index) === '}') {
        ++_index;
        return {
          type: 'Hash',
          content: []
        };
      }

      var defItem, hi, comma, hash = [];
      var hasDefItem = false;
      while (true) {
        defItem = false;
        if (_source.charAt(_index) === '*') {
          ++_index;
          if (hasDefItem) {
            throw error('Default item redefinition forbidden');
          }
          defItem = true;
          hasDefItem = true;
        }
        hi = getKVP('HashItem');
        hi['default'] = defItem;
        hash.push(hi);
        getWS();

        comma = _source.charAt(_index) === ',';
        if (comma) {
          ++_index;
          getWS();
        }
        if (_source.charAt(_index) === '}') {
          ++_index;
          break;
        }
        if (!comma) {
          throw error('Expected "}"');
        }
      }
      return {
        type: 'Hash',
        content: hash
      };
    }

    function getString(opchar) {
      var len = opchar.length;
      var start = _index + len;

      var close = _source.indexOf(opchar, start);
      // we look for a closing of the string here
      // and then we check if it's preceeded by '\'
      // 92 == '\'
      while (close !== -1 &&
             _source.charCodeAt(close - 1) === 92 &&
             _source.charCodeAt(close - 2) !== 92) {
        close = _source.indexOf(opchar, close + 1);
      }
      if (close === -1) {
        throw error('Unclosed string literal');
      }
      var str = _source.slice(start, close);

      _index = close + len;
      return {
        type: 'String',
        content: str,
        // we don't care about escaped cases here;  they are rare enough.
        // if there is no {{ at all, it's definitely not a complex string.
        // if there's a \{{, it's not complex either, but we will learn that 
        // lazily in parseString
        isNotComplex: str.indexOf('{{') === -1 || undefined
      };
    }

    function getValue(optional, ch) {
      if (ch === undefined) {
        ch = _source.charAt(_index);
      }
      if (ch === "'" || ch === '"') {
        if (ch === _source.charAt(_index + 1) && 
            ch === _source.charAt(_index + 2)) {
          return getString(ch + ch + ch);
        }
        return getString(ch);
      }
      if (ch === '{') {
        return getHash();
      }
      if (!optional) {
        throw error('Unknown value type');
      }
      return null;
    }


    function getRequiredWS() {
      var pos = _index;
      var cc = _source.charCodeAt(pos);
      // space, \n, \t, \r
      while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
        cc = _source.charCodeAt(++_index);
      }
      return _index !== pos;
    }

    function getWS() {
      var cc = _source.charCodeAt(_index);
      // space, \n, \t, \r
      while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
        cc = _source.charCodeAt(++_index);
      }
    }

    function getVariable() {
      ++_index;
      return {
        type: 'VariableExpression',
        id: getIdentifier()
      };
    }

    function getIdentifier() {
      var index = _index;
      var start = index;
      var source = _source;
      var cc = source.charCodeAt(start);

      // a-zA-Z_
      if ((cc < 97 || cc > 122) && (cc < 65 || cc > 90) && cc !== 95) {
        throw error('Identifier has to start with [a-zA-Z_]');
      }

      cc = source.charCodeAt(++index);
      while ((cc >= 95 && cc <= 122) || // a-z
             (cc >= 65 && cc <= 90) ||  // A-Z
             (cc >= 48 && cc <= 57) ||  // 0-9
             cc === 95) {               // _
        cc = source.charCodeAt(++index);
      }
      _index = index;
      return {
        type: 'Identifier',
        name: source.slice(start, index)
      };
    }

    function getImportStatement() {
      _index += 6;
      if (_source.charAt(_index) !== '(') {
        throw error('Expected "("');
      }
      ++_index;
      getWS();
      var uri = getString(_source.charAt(_index));
      getWS();
      if (_source.charAt(_index) !== ')') {
        throw error('Expected ")"');
      }
      ++_index;
      return {
        type: 'ImportStatement',
        uri: uri
      };
    }

    function getMacro(id) {
      if (id.name.charAt(0) === '_') {
        throw error('Macro ID cannot start with "_"');
      }
      ++_index;
      var idlist = getItemList(getVariable, ')');
      getRequiredWS();

      if (_source.charAt(_index) !== '{') {
        throw error('Expected "{"');
      }
      ++_index;
      getWS();
      var exp = getExpression();
      getWS();
      if (_source.charAt(_index) !== '}') {
        throw error('Expected "}"');
      }
      ++_index;
      getWS();
      if (_source.charCodeAt(_index) !== 62) {
        throw error('Expected ">"');
      }
      ++_index;
      return {
        type: 'Macro',
        id: id,
        args: idlist,
        expression: exp
      };
    }

    function getEntity(id, index) {
      if (!getRequiredWS()) {
        throw error('Expected white space');
      }

      var ch = _source.charAt(_index);
      var value = getValue(true, ch);
      var attrs = [];
      if (value === null) {
        if (ch === '>') {
          throw error('Expected ">"');
        }
        attrs = getAttributes();
      } else {
        var ws1 = getRequiredWS();
        if (_source.charAt(_index) !== '>') {
          if (!ws1) {
            throw error('Expected ">"');
          }
          attrs = getAttributes();
        }
      }

      // skip '>'
      ++_index;
      return {
        type: 'Entity',
        id: id,
        value: value,
        index: index,
        attrs: attrs,
        local: (id.name.charCodeAt(0) === 95) // _
      };
    }

    function getEntry() {
      var cc = _source.charCodeAt(_index);

      // 60 == '<'
      if (cc === 60) {
        ++_index;
        var id = getIdentifier();
        cc = _source.charCodeAt(_index);
        // 40 == '('
        if (cc === 40) {
          return getMacro(id);
        }
        // 91 == '['
        if (cc === 91) {
          ++_index;
          return getEntity(id,
                           getItemList(getExpression, ']'));
        }
        return getEntity(id, []);
      }
      // 47, 42 == '/*'
      if (_source.charCodeAt(_index) === 47 &&
                 _source.charCodeAt(_index + 1) === 42) {
        return getComment();
      }
      if (_source.slice(_index, _index + 6) === 'import') {
        return getImportStatement();
      }
      throw error('Invalid entry');
    }

    function getComplexString() {
      /*
       * This is a very complex function, sorry for that
       *
       * It basically parses a string looking for:
       *   - expression openings: {{
       *   - escape chars: \
       * 
       * And if it finds any it deals with them.
       * The result is quite fast, except for getExpression which as
       * of writing does a poor job at nesting many functions in order
       * to get to the most common type - Identifier.
       *
       * We can fast path that, we can rewrite expression engine to minimize
       * function nesting or we can wait for engines to become faster.
       *
       * For now, it's fast enough :)
       */
      var nxt;                    // next char in backslash case
      var body;                   // body of a complex string
      var bstart = _index;        // buffer start index
      var complex = false;
      var placeables = 0;         // number of placeables found, capped by 
                                  // MAX_PLACEABLES

      // unescape \\ \' \" \{{
      var pos = _source.indexOf('\\');
      while (pos !== -1) {
        nxt = _source.charAt(pos + 1);
        if (nxt == '"' ||
            nxt == "'" ||
            nxt == '\\') {
          _source = _source.substr(0, pos) + _source.substr(pos + 1);
        }
        pos = _source.indexOf('\\', pos + 1);
      }

      // parse expressions
      pos = _source.indexOf('{{');
      while (pos !== -1) {
        // except if the expression is prefixed with \
        // in that case skip it
        if (_source.charCodeAt(pos - 1) === 92) {
          _source = _source.substr(0, pos - 1) + _source.substr(pos);
          pos = _source.indexOf('{{', pos + 2);
          continue;
        }
        if (!complex) {
          body = [];
          complex = true;
        }
        if (placeables > MAX_PLACEABLES - 1) {
          throw error('Too many placeables, maximum allowed is ' +
                      MAX_PLACEABLES);
        }
        if (bstart < pos) {
          body.push({
            type: 'String',
            content: _source.slice(bstart, pos)
          });
        }
        _index = pos + 2;
        getWS();
        body.push(getExpression());
        getWS();
        if (_source.charCodeAt(_index) !== 125 ||
            _source.charCodeAt(_index + 1) !== 125) {
          throw error('Expected "}}"');
        }
        placeables++;
        pos = _index + 2;
        bstart = pos;
        pos = _source.indexOf('{{', pos);
      }

      // if complexstring is just one string, return it instead
      if (!complex) {
        return {
          type: 'String',
          content: _source
        };
      }

      // if there's leftover string we pick it
      if (bstart < _length) {
        body.push({
          type: 'String',
          content: _source.slice(bstart)
        });
      }
      return {
        type: 'ComplexString',
        content: body
      };
    }

    function getLOLWithRecover() {
      var entries = [];

      getWS();
      while (_index < _length) {
        try {
          entries.push(getEntry());
        } catch (e) {
          if (e instanceof ParserError) {
            _emitter.emit('error', e);
            entries.push(recover());
          } else {
            throw e;
          }
        }
        if (_index < _length) {
          getWS();
        }
      }

      return {
        type: 'LOL',
        body: entries
      };
    }

    function getLOLPlain() {
      var entries = [];

      getWS();
      while (_index < _length) {
        entries.push(getEntry());
        if (_index < _length) {
          getWS();
        }
      }

      return {
        type: 'LOL',
        body: entries
      };
    }

    /* Public API functions */

    function parseString(string) {
      _source = string;
      _index = 0;
      _length = _source.length;
      try {
        return getComplexString();
      } catch (e) {
        if (_emitter && e instanceof ParserError) {
          _emitter.emit('error', e);
        }
        throw e;
      }
    }

    function parse(string) {
      _source = string;
      _index = 0;
      _length = _source.length;

      return getLOL();
    }

    function addEventListener(type, listener) {
      if (!_emitter) {
        throw Error('Emitter not available');
      }
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      if (!_emitter) {
        throw Error('Emitter not available');
      }
      return _emitter.removeEventListener(type, listener);
    }

    /* Expressions */

    function getExpression() {
      return getConditionalExpression();
    }

    function getPrefixExpression(token, cl, op, nxt) {
      var exp = nxt();
      var t, ch;
      while (true) {
        t = '';
        getWS();
        ch = _source.charAt(_index);
        if (token[0].indexOf(ch) === -1) {
          break;
        }
        t += ch;
        ++_index;
        if (token.length > 1) {
          ch = _source.charAt(_index);
          if (token[1] == ch) {
            ++_index;
            t += ch;
          } else if (token[2]) {
            --_index;
            return exp;
          }
        }
        getWS();
        exp = {
          type: cl,
          operator: {
            type: op,
            token: t
          },
          left: exp,
          right: nxt()
        };
      }
      return exp;
    }

    function getPostfixExpression(token, cl, op, nxt) {
      var cc = _source.charCodeAt(_index);
      if (token.indexOf(cc) === -1) {
        return nxt();
      }
      ++_index;
      getWS();
      return {
        type: cl,
        operator: {
          type: op,
          token: String.fromCharCode(cc)
        },
        argument: getPostfixExpression(token, cl, op, nxt)
      };
    }

    function getConditionalExpression() {
      var exp = getOrExpression();
      getWS();
      if (_source.charCodeAt(_index) !== 63) { // ?
        return exp;
      }
      ++_index;
      getWS();
      var consequent = getExpression();
      getWS();
      if (_source.charCodeAt(_index) !== 58) { // :
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: 'ConditionalExpression',
        test: exp,
        consequent: consequent,
        alternate: getExpression()
      };
    }

    function getOrExpression() {
      return getPrefixExpression([['|'], '|', true],
                                 'LogicalExpression',
                                 'LogicalOperator',
                                 getAndExpression);
    }

    function getAndExpression() {
      return getPrefixExpression([['&'], '&', true],
                                 'LogicalExpression',
                                 'Logicalperator',
                                 getEqualityExpression);
    }

    function getEqualityExpression() {
      return getPrefixExpression([['=', '!'], '=', true],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getRelationalExpression);
    }

    function getRelationalExpression() {
      return getPrefixExpression([['<', '>'], '=', false],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getAdditiveExpression);
    }

    function getAdditiveExpression() {
      return getPrefixExpression([['+', '-']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getModuloExpression);
    }

    function getModuloExpression() {
      return getPrefixExpression([['%']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getMultiplicativeExpression);
    }

    function getMultiplicativeExpression() {
      return getPrefixExpression([['*']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getDividiveExpression);
    }

    function getDividiveExpression() {
      return getPrefixExpression([['/']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getUnaryExpression);
    }

    function getUnaryExpression() {
      return getPostfixExpression([43, 45, 33], // + - !
                                  'UnaryExpression',
                                  'UnaryOperator',
                                  getMemberExpression);
    }

    function getCallExpression(callee) {
      getWS();
      return {
        type: 'CallExpression',
        callee: callee,
        arguments: getItemList(getExpression, ')')
      };
    }

    function getAttributeExpression(idref, computed) {
      if (idref.type !== 'ParenthesisExpression' &&
          idref.type !== 'Identifier' &&
          idref.type !== 'ThisExpression') {
        throw error('AttributeExpression must have Identifier, This or ' +
                    'Parenthesis as left node');
      }
      var exp;
      if (computed) {
        getWS();
        exp = getExpression();
        getWS();
        if (_source.charAt(_index) !== ']') {
          throw error('Expected "]"');
        }
        ++_index;
        return {
          type: 'AttributeExpression',
          expression: idref,
          attribute: exp,
          computed: true
        };
      }
      exp = getIdentifier();
      return {
        type: 'AttributeExpression',
        expression: idref,
        attribute: exp,
        computed: false
      };
    }

    function getPropertyExpression(idref, computed) {
      var exp;
      if (computed) {
        getWS();
        exp = getExpression();
        getWS();
        if (_source.charAt(_index) !== ']') {
          throw error('Expected "]"');
        }
        ++_index;
        return {
          type: 'PropertyExpression',
          expression: idref,
          property: exp,
          computed: true
        };
      }
      exp = getIdentifier();
      return {
        type: 'PropertyExpression',
        expression: idref,
        property: exp,
        computed: false
      };
    }

    function getMemberExpression() {
      var exp = getParenthesisExpression();
      var cc;

      // 46: '.'
      // 40: '('
      // 58: ':'
      // 91: '['
      while (true) {
        cc = _source.charCodeAt(_index);
        if (cc === 46 || cc === 91) { // . or [
          ++_index;
          exp = getPropertyExpression(exp, cc === 91);
        } else if (cc === 58 && 
                   _source.charCodeAt(_index + 1) === 58) { // ::
          _index += 2;
          if (_source.charCodeAt(_index) === 91) { // [
            ++_index;
            exp = getAttributeExpression(exp, true);
          } else {
            exp = getAttributeExpression(exp, false);
          }
        } else if (cc === 40) { // (
          ++_index;
          exp = getCallExpression(exp);
        } else {
          break;
        }
      }
      return exp;
    }

    function getParenthesisExpression() {
      // 40 == (
      if (_source.charCodeAt(_index) === 40) {
        ++_index;
        getWS();
        var pexp = {
          type: 'ParenthesisExpression',
          expression: getExpression()
        };
        getWS();
        if (_source.charCodeAt(_index) !== 41) {
          throw error('Expected ")"');
        }
        ++_index;
        return pexp;
      }
      return getPrimaryExpression();
    }

    function getPrimaryExpression() {
      var pos = _index;
      var cc = _source.charCodeAt(pos);
      // number
      while (cc > 47 && cc < 58) {
        cc = _source.charCodeAt(++pos);
      }
      if (pos > _index) {
        var start = _index;
        _index = pos;
        return {
          type: 'Number',
          value: parseInt(_source.slice(start, pos), 10)
        };
      }

      switch (cc) {
        // value: '"{[
        case 39:
        case 34:
        case 123:
        case 91:
          return getValue();

        // variable: $
        case 36:
          return getVariable();

        // globals: @
        case 64:
          ++_index;
          return {
            type: 'GlobalsExpression',
              id: getIdentifier()
          };

        // this: ~
        case 126:
          ++_index;
          return {
            type: 'ThisExpression'
          };

        default:
          return getIdentifier();
      }
    }

    /* helper functions */

    function getItemList(callback, closeChar) {
      var ch;
      getWS();
      if (_source.charAt(_index) === closeChar) {
        ++_index;
        return [];
      }

      var items = [];

      while (true) {
        items.push(callback());
        getWS();
        ch = _source.charAt(_index);
        if (ch === ',') {
          ++_index;
          getWS();
        } else if (ch === closeChar) {
          ++_index;
          break;
        } else {
          throw error('Expected "," or "' + closeChar + '"');
        }
      }
      return items;
    }

    function error(message, pos) {
      if (pos === undefined) {
        pos = _index;
      }
      var start = _source.lastIndexOf('<', pos - 1);
      var lastClose = _source.lastIndexOf('>', pos - 1);
      start = lastClose > start ? lastClose + 1 : start;
      var context = _source.slice(start, pos + 10);

      var msg = message + ' at pos ' + pos + ': "' + context + '"';
      return new ParserError(msg, pos, context);
    }

    // This code is being called whenever we
    // hit ParserError.
    //
    // The strategy here is to find the closest entry opening
    // and skip forward to it.
    //
    // It may happen that the entry opening is in fact part of expression,
    // but this should just trigger another ParserError on the next char
    // and we'll have to scan for entry opening again until we're successful
    // or we run out of entry openings in the code.
    function recover() {
      var opening = _source.indexOf('<', _index);
      var junk;
      if (opening === -1) {
        junk = {
          'type': 'JunkEntry',
          'content': _source.slice(_index)
        };
        _index = _length;
        return junk;
      }
      junk = {
        'type': 'JunkEntry',
        'content': _source.slice(_index, opening)
      };
      _index = opening;
      return junk;
    }
  }

  /* ParserError class */

  Parser.Error = ParserError;

  function ParserError(message, pos, context) {
    this.name = 'ParserError';
    this.message = message;
    this.pos = pos;
    this.context = context;
  }
  ParserError.prototype = Object.create(Error.prototype);
  ParserError.prototype.constructor = ParserError;

  exports.Parser = Parser;

});
