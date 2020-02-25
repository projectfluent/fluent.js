PACKAGE := fluent-gecko

include ../common.mk

# Expand a package name ("fluent") into a version tag ("fluent@0.10.0").
version = $(1)@$(shell node -e "\
	console.log(require('../$(1)/package.json').version)")

test:
	@nyc --reporter=text --reporter=html mocha \
	    --recursive --ui tdd \
	    --require esm \
	    test/**/*_test.js

build: Fluent.jsm FluentSyntax.jsm Localization.jsm DOMLocalization.jsm l10n.js fluent-react.js

Fluent.jsm: $(SOURCES)
	$(MAKE) -sC ../fluent-bundle compile
	@rollup $(CURDIR)/src/fluent.js \
	    --config ./xpcom_config.js \
	    --output.intro "/* $(call version,fluent-bundle) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

FluentSyntax.jsm: $(SOURCES)
	$(MAKE) -sC ../fluent-syntax compile
	@rollup $(CURDIR)/src/fluent_syntax.js \
	    --config ./xpcom_config.js \
	    --no-treeshake \
	    --no-freeze \
	    --output.intro "/* $(call version,fluent-syntax) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

Localization.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/localization.js \
	    --config ./xpcom_config.js \
	    --output.intro "/* $(call version,fluent-dom) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

DOMLocalization.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/dom_localization.js \
	    --config ./xpcom_dom_config.js \
	    --output.intro "/* $(call version,fluent-dom) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

l10n.js: $(SOURCES)
	@rollup $(CURDIR)/src/l10n.js \
	    --output.format es \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

fluent-react.js: $(SOURCES)
	@rollup $(CURDIR)/src/fluent-react.js \
	    --config ./vendor_config.js \
	    --output.intro "/* $(call version,fluent-react) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

clean:
	@rm -rf dist
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"

lint: _lint
html: _html
