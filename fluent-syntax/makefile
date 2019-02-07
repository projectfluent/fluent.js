PACKAGE := fluent-syntax
GLOBAL  := FluentSyntax

include ../common.mk

build: $(PACKAGE).js compat.js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config $(ROOT)/bundle_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.file $@
	@echo -e " $(OK) $@ built"

FluentSyntax.jsm: $(SOURCES)
	@rollup \
	    --config ./xpcom_config.js \
	    --output.file $@
	@echo -e " $(OK) $@ built"

compat.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config $(ROOT)/compat_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.file $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js FluentSyntax.jsm compat.js
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"

STRUCTURE_FTL := $(wildcard test/fixtures_structure/*.ftl)
STRUCTURE_AST := $(STRUCTURE_FTL:.ftl=.json)

fixtures: $(STRUCTURE_AST)

.PHONY: $(STRUCTURE_AST)
$(STRUCTURE_AST): test/fixtures_structure/%.json: test/fixtures_structure/%.ftl
	@../tools/parse.js --silent --with-spans $< > $@
	@echo -e " $(OK) $@"
