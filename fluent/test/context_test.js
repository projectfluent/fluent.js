'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';
import FluentResource from '../src/resource';

suite('Bundle', function() {
  let bundle, args, errs;

  setup(function() {
    errs = [];
  });

  suite('addMessages', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        -bar = Private Bar
        `);
    });

    test('adds messages', function() {
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);
    });

    test('preserves existing messages when new are added', function() {
      bundle.addMessages(ftl`
        baz = Baz
        `);

      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);

      assert.equal(bundle._messages.has('baz'), true);
      assert.equal(bundle._terms.has('baz'), false);
    });

    test('messages and terms can share the same name', function() {
      bundle.addMessages(ftl`
        -foo = Private Foo
        `);
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-foo'), false);
      assert.equal(bundle._terms.has('-foo'), true);
    });


    test('does not overwrite existing messages if the ids are the same', function() {
      const errors = bundle.addMessages(ftl`
        foo = New Foo
        `);

      // Attempt to overwrite error reported
      assert.equal(errors.length, 1);

      assert.equal(bundle._messages.size, 2);

      const msg = bundle.getMessage('foo');
      const val = bundle.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    test('overwrites existing messages if the ids are the same and allowOverrides is true', function() {
      const errors = bundle.addMessages(ftl`
        foo = New Foo
        `, { allowOverrides: true });

      // No overwrite errors reported
      assert.equal(errors.length, 0);

      assert.equal(bundle._messages.size, 2);

      const msg = bundle.getMessage('foo');
      const val = bundle.format(msg, args, errs);
      assert.equal(val, 'New Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('addResource', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      let resource = FluentResource.fromString(ftl`
        foo = Foo
        -bar = Bar
        `);
      bundle.addResource(resource);
    });

    test('adds messages', function() {
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);
    });
  });

  suite('allowOverrides', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      let resource1 = FluentResource.fromString('key = Foo');
      bundle.addResource(resource1);
    });

    test('addResource allowOverrides is false', function() {
      let resource2 = FluentResource.fromString('key = Bar');
      let errors = bundle.addResource(resource2);
      assert.equal(errors.length, 1);
      let msg = bundle.getMessage('key');
      assert.equal(bundle.format(msg), 'Foo');
    });

    test('addResource allowOverrides is true', function() {
      let resource2 = FluentResource.fromString('key = Bar');
      let errors = bundle.addResource(resource2, { allowOverrides: true });
      assert.equal(errors.length, 0);
      let msg = bundle.getMessage('key');
      assert.equal(bundle.format(msg), 'Bar');
    });
  });

  suite('hasMessage', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        bar =
            .attr = Bar Attr
        -term = Term

        # ERROR No value.
        err1 =
        # ERROR Broken value.
        err2 = {}
        # ERROR No attribute value.
        err3 =
            .attr =
        # ERROR Broken attribute value.
        err4 =
            .attr1 = Attr
            .attr2 = {}
        `);
    });

    test('returns true only for public messages', function() {
      assert.equal(bundle.hasMessage('foo'), true);
    });

    test('returns false for terms and missing messages', function() {
      assert.equal(bundle.hasMessage('-term'), false);
      assert.equal(bundle.hasMessage('missing'), false);
      assert.equal(bundle.hasMessage('-missing'), false);
    });

    test('returns false for broken messages', function() {
      assert.equal(bundle.hasMessage('err1'), false);
      assert.equal(bundle.hasMessage('err2'), false);
      assert.equal(bundle.hasMessage('err3'), false);
      assert.equal(bundle.hasMessage('err4'), false);
    });
  });

  suite('getMessage', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        -bar = Bar
        `);
    });

    test('returns public messages', function() {
      assert.equal(bundle.getMessage('foo'), 'Foo');
    });

    test('returns null for terms and missing messages', function() {
      assert.equal(bundle.getMessage('-bar'), null);
      assert.equal(bundle.getMessage('baz'), null);
      assert.equal(bundle.getMessage('-baz'), null);
    });
  });

});
