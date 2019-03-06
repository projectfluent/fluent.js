PACKAGE := fluent-gecko

include ../common.mk

# Expand a package name ("fluent") into a version tag ("fluent@0.10.0").
version = $(1)@$(shell node -e "\
	console.log(require('../$(1)/package.json').version)")

build: Fluent.jsm FluentSyntax.jsm Localization.jsm DOMLocalization.jsm l10n.js

Fluent.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/message_context.js \
	    --config ./xpcom_config.js \
	    --output.intro "/* $(call version,fluent) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

FluentSyntax.jsm: $(SOURCES)
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

clean:
	@rm -rf dist
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
