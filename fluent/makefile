PACKAGE := fluent
GLOBAL  := Fluent

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

compat.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config $(ROOT)/compat_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.file $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"

STRUCTURE_FTL := $(wildcard ../fluent-syntax/test/fixtures_structure/*.ftl)
STRUCTURE_JSON := $(STRUCTURE_FTL:../fluent-syntax/test/fixtures_structure/%.ftl=test/fixtures_structure/%.json)

fixtures: $(STRUCTURE_JSON)

.PHONY: $(STRUCTURE_JSON)
$(STRUCTURE_JSON): test/fixtures_structure/%.json: ../fluent-syntax/test/fixtures_structure/%.ftl
	@../tools/parse.js -rs $< > $@
	@echo -e " $(OK) $@"
