PACKAGE := fluent-gecko

include ../common.mk

build: MessageContext.jsm Localization.jsm DOMLocalization.jsm l10n.js

MessageContext.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/message_context.js \
	    --config ./xpcom_config.js \
	    --output ./dist/$@
	@echo -e " $(OK) $@ built"

Localization.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/localization.js \
	    --config ./xpcom_config.js \
	    --output ./dist/$@
	@echo -e " $(OK) $@ built"

DOMLocalization.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/dom_localization.js \
	    --config ./xpcom_dom_config.js \
	    --output ./dist/$@
	@echo -e " $(OK) $@ built"

l10n.js: $(SOURCES)
	@rollup $(CURDIR)/src/l10n.js \
	    --config ./xpcom_config.js \
	    --output ./dist/$@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f ./dist/MessageContext.jsm
	@rm -f ./dist/Localization.jsm
	@rm -f ./dist/DOMLocalization.jsm
	@rm -f ./dist/l10n.js
	@echo -e " $(OK) clean"
