PACKAGE := fluent-langneg
GLOBAL  := FluentLangNeg

include ../common.mk

build: $(PACKAGE).js
compat: compat.js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --format umd \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output $@
	@echo -e " $(OK) $@ built"

compat.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config $(ROOT)/compat_config.js \
	    --format umd \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"
