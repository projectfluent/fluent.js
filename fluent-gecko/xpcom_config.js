const version = require('../fluent/package.json').version;

export default {
  format: 'es',
  banner: `/* vim: set ts=2 et sw=2 tw=80 filetype=javascript: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */\n\n`,
  intro: `/* fluent@${version} */`,
  preferConst: true,
  context: 'this'
};
