PACKAGE := fluent-web
GLOBAL  := FluentWeb

include ../common.mk

build: $(PACKAGE).js compat.js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
		--format iife \
		--banner "/* $(PACKAGE)@$(VERSION) */" \
		--id $(PACKAGE) \
		--name $(GLOBAL) \
		--config $(CURDIR)/bundle_config.js \
		--output $@
	@echo -e " $(OK) $@ built"

compat.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
		--config $(CURDIR)/compat_config.js \
		--format umd \
		--banner "/* $(PACKAGE)@$(VERSION) */" \
		--id $(PACKAGE) \
		--name $(GLOBAL) \
		--output $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"
