PACKAGE := fluent-react
GLOBAL  := FluentReact
DEPS    := fluent:Fluent,react:React

include ../common.mk

build: $(PACKAGE).js
compat: compat.js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --format umd \
	    --id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --globals $(DEPS) \
	    --output $@
	@echo -e " $(OK) $@ built"

compat.js: $(PACKAGE).js
	@babel --presets latest $< > $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"
