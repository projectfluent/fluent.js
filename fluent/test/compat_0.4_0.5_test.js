'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite.only('Compatibility', function () {
  suite('browser/preferences/main.ftl', function () {
    let args, errs;

    setup(function () {
      args = {
        num: 3
      };
      errs = [];
    });

    test('0.4 syntax', function () {
      const ctx = new MessageContext('en-US', { useIsolating: false });
      const parsingErrors = ctx.addMessages(ftl`
        // Variables:
        //   $num - default value of the \`dom.ipc.processCount\` pref.
        default-content-process-count
            .label = { $num } (default)
      `);

      assert.deepEqual(parsingErrors, []);

      const msg = ctx.getMessage('default-content-process-count');

      assert.equal(
        ctx.format(msg, args, errs),
        null);
      assert.equal(errs.length, 0);

      assert.equal(
        ctx.format(msg.attrs.label, args, errs),
        '3 (default)');
      assert.equal(errs.length, 0);
    });

    test('0.5 syntax', function () {
      const ctx = new MessageContext('en-US', { useIsolating: false });
      const parsingErrors = ctx.addMessages(ftl`
        # Variables:
        #   $num - default value of the \`dom.ipc.processCount\` pref.
        default-content-process-count =
            .label = { $num } (default)
      `);

      assert.deepEqual(parsingErrors, [
        new SyntaxError('Expected an identifier (starting with [a-zA-Z_])')
      ]);

      const msg = ctx.getMessage('default-content-process-count');

      assert.equal(
        ctx.format(msg, args, errs),
        null);
      assert.equal(errs.length, 0);

      assert.equal(
        ctx.format(msg.attrs.label, args, errs),
        '3 (default)');
      assert.equal(errs.length, 0);
    });
  });

  suite('browser/preferences/privacy.ftl', function () {
    let args, errs;

    setup(function () {
      args = {};
      errs = [];
    });

    test('0.4 syntax', function () {
      const ctx = new MessageContext('en-US', { useIsolating: false });
      const parsingErrors = ctx.addMessages(ftl`
        // This Source Code Form is subject to the terms of the Mozilla Public
        // License, v. 2.0. If a copy of the MPL was not distributed with this
        // file, You can obtain one at http://mozilla.org/MPL/2.0/.

        [[ Do Not Track ]]

        do-not-track-description = Send websites a “Do Not Track” signal
        do-not-track-learn-more = Learn more
        do-not-track-option-default
            .label = Only when using Tracking Protection
        do-not-track-option-always
            .label = Always
      `);

      assert.deepEqual(parsingErrors, []);

      const msg1 = ctx.getMessage('do-not-track-description');
      assert.equal(
        ctx.format(msg1, args, errs),
        'Send websites a “Do Not Track” signal');
      assert.equal(errs.length, 0);

      const msg2 = ctx.getMessage('do-not-track-learn-more');
      assert.equal(
        ctx.format(msg2, args, errs),
        'Learn more');
      assert.equal(errs.length, 0);

      const msg3 = ctx.getMessage('do-not-track-option-default');
      assert.equal(
        ctx.format(msg3.attrs.label, args, errs),
        'Only when using Tracking Protection');
      assert.equal(errs.length, 0);

      const msg4 = ctx.getMessage('do-not-track-option-always');
      assert.equal(
        ctx.format(msg4.attrs.label, args, errs),
        'Always');
      assert.equal(errs.length, 0);
    });

    test('0.5 syntax', function () {
      const ctx = new MessageContext('en-US', { useIsolating: false });
      const parsingErrors = ctx.addMessages(ftl`
        # This Source Code Form is subject to the terms of the Mozilla Public
        # License, v. 2.0. If a copy of the MPL was not distributed with this
        # file, You can obtain one at http://mozilla.org/MPL/2.0/.

        ## Do Not Track

        do-not-track-description = Send websites a “Do Not Track” signal
        do-not-track-learn-more = Learn more
        do-not-track-option-default =
            .label = Only when using Tracking Protection
        do-not-track-option-always =
            .label = Always
      `);

      assert.deepEqual(parsingErrors, [
        new SyntaxError('Expected an identifier (starting with [a-zA-Z_])')
      ]);

      const msg1 = ctx.getMessage('do-not-track-description');
      assert.equal(
        ctx.format(msg1, args, errs),
        'Send websites a “Do Not Track” signal');
      assert.equal(errs.length, 0);

      const msg2 = ctx.getMessage('do-not-track-learn-more');
      assert.equal(
        ctx.format(msg2, args, errs),
        'Learn more');
      assert.equal(errs.length, 0);

      const msg3 = ctx.getMessage('do-not-track-option-default');
      assert.equal(
        ctx.format(msg3.attrs.label, args, errs),
        'Only when using Tracking Protection');
      assert.equal(errs.length, 0);

      const msg4 = ctx.getMessage('do-not-track-option-always');
      assert.equal(
        ctx.format(msg4.attrs.label, args, errs),
        'Always');
      assert.equal(errs.length, 0);
    });
  });
});
