DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

define BANNER
/* vim: set ts=2 et sw=2 tw=80 filetype=javascript: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
endef

export BANNER

build:
  rollup IntlMessageContext.jsm \
      -f cjs \
      --banner "$$BANNER" \
      -o $(DIST)/IntlMessageContext.jsm
  rollup L10nService.jsm \
      -f cjs \
      --banner "$$BANNER" \
      -o $(DIST)/L10nService.jsm
  rollup l20n-html.js \
      -c ./rollup.config.js \
      -o $(DIST)/l20n-html.js
  rollup l20n-xul.js \
      -c ./rollup.config.js \
      -o $(DIST)/l20n-xul.js
