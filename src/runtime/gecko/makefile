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
	rollup l20n-html.js \
	    -f iife \
	    -o $(DIST)/l20n-html.js
	rollup l20n-xul.js \
	    -f iife \
	    -o $(DIST)/l20n-xul.js
