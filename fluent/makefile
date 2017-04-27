PACKAGE := fluent
GLOBAL  := Fluent

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
	@babel --presets latest $< > $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@rm -rf coverage
	@echo -e " $(OK) clean"

STRUCTURE_FTL := $(wildcard ../fluent-syntax/test/fixtures_structure/*.ftl)
STRUCTURE_JSON := $(STRUCTURE_FTL:../fluent-syntax/test/fixtures_structure/%.ftl=test/fixtures_structure/%.json)

fixtures: $(STRUCTURE_JSON)

.PHONY: $(STRUCTURE_JSON)
$(STRUCTURE_JSON): test/fixtures_structure/%.json: ../fluent-syntax/test/fixtures_structure/%.ftl
	@../tools/parse.js -rs $< > $@
	@echo -e " $(OK) $@"
