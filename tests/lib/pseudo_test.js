'use strict';

import assert from 'assert';
import { pseudo, walkEntry } from '../../src/lib/pseudo';
import PropertiesParser from '../../src/lib/format/properties/parser';

describe('pseudo strategy', function() {
  var strategy, source, ast, walked;

  beforeEach(function() {
    ast = PropertiesParser.parse(null, source);
    walked = pseudolocalize(ast, strategy);
  });

  function pseudolocalize(arr, strategy) {
    var obj = {};
    for (var id in arr) {
      obj[id] = walkEntry(arr[id], strategy);
    }
    return obj;
  }

  var foo = {type: 'idOrVar', name: 'foo'};
  var bar = {type: 'idOrVar', name: 'bar'};

  describe('accented English', function(){

    before(function() {
      strategy = pseudo['fr-x-psaccent'].process;
      source = [
        'foo=Foo',

        'bar={[ plural(n) ]}',
        'bar[one]=One',
        'bar[two]=Two',
        'bar[few]=Few',
        'bar[many]=Many',
        'bar[other]=Other',

        'baz.attr=An attribute',
        'baz.attrComplex=An attribute referencing {{ foo }}',

        'templateVar={name} wrote',
        'dateFormat=%A, %b %Eb',
        'twoPlaceables1={{ foo }} {{ bar }}',
        'twoPlaceables2=Foo {{ foo }} and bar {{ bar }}',
        'parens1=({{ foo }}) {{ bar }}',
        'parens2=Foo ({{foo}}) [and/or {{bar}}]',
        'parens3=Foo (and) bar',
        'unicode=Foo \u0066\u006f\u006f\u0020',
        'nonascii=Naïve coöperation résumé dæmon phœnix',
        'html1=visit <a>url</a>',
        'html2=type <input placeholder="your name"/>',
      ].join('\n');
    });

    it('walks the value', function(){
      assert.strictEqual(walked.foo, 'Ƒǿǿǿǿ');

      assert.strictEqual(walked.bar.value.one, 'Ǿǿƞḗḗ');
      assert.strictEqual(walked.bar.value.two, 'Ŧẇǿǿ');
      assert.strictEqual(walked.bar.value.few, 'Ƒḗḗẇ');
      assert.strictEqual(walked.bar.value.many, 'Ḿȧȧƞẏ');
      assert.strictEqual(walked.bar.value.other, 'Ǿǿŧħḗḗř');

      assert.strictEqual(walked.baz.attrs.attr, 'Ȧȧƞ ȧȧŧŧřīīƀŭŭŧḗḗ');
      assert.deepEqual(
        walked.baz.attrs.attrComplex.value,
        ['Ȧȧƞ ȧȧŧŧřīīƀŭŭŧḗḗ řḗḗƒḗḗřḗḗƞƈīīƞɠ ', foo]);

      assert.strictEqual(walked.templateVar, '{name} ẇřǿǿŧḗḗ');
      assert.strictEqual(walked.dateFormat, '%A, %b %Eb');
      assert.deepEqual(walked.twoPlaceables1.value, [foo, ' ', bar]);
      assert.deepEqual(
        walked.twoPlaceables2.value, ['Ƒǿǿǿǿ ', foo, ' ȧȧƞḓ ƀȧȧř ', bar]);
      assert.deepEqual(
        walked.parens1.value, ['(', foo, ') ', bar]);
      assert.deepEqual(
        walked.parens2.value, ['Ƒǿǿǿǿ (', foo, ') [ȧȧƞḓ/ǿǿř ', bar, ']']);
      assert.strictEqual(walked.parens3, 'Ƒǿǿǿǿ (ȧȧƞḓ) ƀȧȧř');
      assert.strictEqual(walked.unicode, 'Ƒǿǿǿǿ ƒǿǿǿǿ ');
      assert.strictEqual(
        walked.nonascii,
        'Ƞȧȧïṽḗḗ ƈǿǿöƥḗḗřȧȧŧīīǿǿƞ řéşŭŭḿé ḓæḿǿǿƞ ƥħœƞīīẋ');
      assert.strictEqual(walked.html1, 'ṽīīşīīŧ <a>ŭŭřŀ</a>');
      assert.strictEqual(
        walked.html2, 'ŧẏƥḗḗ <input placeholder="your name"/>');
    });

  });

  describe('bidi English', function(){
    /* jshint -W100 */

    before(function() {
      strategy = pseudo['ar-x-psbidi'].process;
      source = [
        'foo=Foo',

        'bar={[ plural(n) ]}',
        'bar[one]=One',
        'bar[two]=Two',
        'bar[few]=Few',
        'bar[many]=Many',
        'bar[other]=Other',

        'baz.attr=An attribute',
        'baz.attrComplex=An attribute referencing {{ foo }}',

        'templateVar={name} wrote',
        'dateFormat=%A, %b %Eb',
        'twoPlaceables1={{ foo }} {{ bar }}',
        'twoPlaceables2=Foo {{ foo }} and bar {{ bar }}',
        'parens1=({{ foo }}) {{ bar }}',
        'parens2=Foo ({{foo}}) [and/or {{bar}}]',
        'parens3=Foo (and) bar',
        'unicode=Foo \u0066\u006f\u006f\u0020',
        'nonascii=Naïve coöperation résumé dæmon phœnix',
        'html1=visit <a>url</a>',
        'html2=type <input placeholder="your name"/>',
      ].join('\n');
    });

    it('walks the value', function(){
      assert.strictEqual(walked.foo, '‮ɟoo‬');

      assert.strictEqual(walked.bar.value.one, '‮Ouǝ‬');
      assert.strictEqual(walked.bar.value.two, '‮⊥ʍo‬');
      assert.strictEqual(walked.bar.value.few, '‮ɟǝʍ‬');
      assert.strictEqual(walked.bar.value.many, '‮Wɐuʎ‬');
      assert.strictEqual(walked.bar.value.other, '‮Oʇɥǝɹ‬');

      assert.strictEqual(
        walked.baz.attrs.attr, '‮∀u‬ ‮ɐʇʇɹıqnʇǝ‬');
      assert.deepEqual(
        walked.baz.attrs.attrComplex.value,
        ['‮∀u‬ ‮ɐʇʇɹıqnʇǝ‬ ‮ɹǝɟǝɹǝuɔıuƃ‬ ',
         foo]);

      assert.strictEqual(walked.templateVar, '{name} ‮ʍɹoʇǝ‬');
      assert.strictEqual(walked.dateFormat, '%A, %b %Eb');
      assert.deepEqual(walked.twoPlaceables1.value, [foo, ' ', bar]);
      assert.deepEqual(
        walked.twoPlaceables2.value,
        ['‮ɟoo‬ ', foo, ' ‮ɐup‬ ‮qɐɹ‬ ',
         bar]);
      assert.deepEqual(
        walked.parens1.value, ['(', foo, ') ', bar]);
      assert.deepEqual(
        walked.parens2.value,
        ['‮ɟoo‬ (', foo, ') [‮ɐup‬/‮oɹ‬ ',
         bar, ']']);
      assert.strictEqual(
        walked.parens3,
        '‮ɟoo‬ (‮ɐup‬) ‮qɐɹ‬');
      assert.strictEqual(
        walked.unicode,
        '‮ɟoo‬ ‮ɟoo‬ ');
      assert.strictEqual(
        walked.html1, '‮ʌısıʇ‬ <a>‮nɹʅ‬</a>');
      assert.strictEqual(
        walked.html2,
        '‮ʇʎdǝ‬ <input placeholder="your name"/>');
    });

    // XXX this requires Unicode support for JavaSript RegExp objects
    // https://bugzil.la/258974
    it.skip('walks the value', function(){
      var walked = walkEntry(ast, strategy);
      assert.strictEqual(
        walked.nonascii,
       '‮Nɐïʌǝ‬ ‮ɔoödǝɹɐʇıou‬ ' +
       '‮ɹésnɯé‬ ‮pæɯou‬ ' +
       '‮dɥœuıx‬');
    });

  });

});
