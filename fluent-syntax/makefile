PACKAGE := fluent-syntax
GLOBAL  := FluentSyntax

include ../common.mk

build: $(PACKAGE).js
compat: compat.js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --format umd \
	    --id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output $@
	@echo -e " $(OK) $@ built"

compat.js: $(PACKAGE).js
	@babel $< > $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"

STRUCTURE_FTL := $(wildcard test/fixtures_structure/*.ftl)
STRUCTURE_AST := $(STRUCTURE_FTL:.ftl=.json)

fixtures: $(STRUCTURE_AST)

.PHONY: $(STRUCTURE_AST)
$(STRUCTURE_AST): test/fixtures_structure/%.json: test/fixtures_structure/%.ftl
	@../tools/parse.js -s $< > $@
	@echo -e " $(OK) $@"
