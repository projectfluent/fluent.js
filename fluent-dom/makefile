PACKAGE := @fluent/dom
GLOBAL := FluentDOM
DEPS    := cached-iterable:CachedIterable

include ../common.mk

build: index.js compat.js

index.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
		--config $(ROOT)/bundle_config.js \
		--banner "/* $(PACKAGE)@$(VERSION) */" \
		--amd.id $(PACKAGE) \
		--name $(GLOBAL) \
		--globals $(DEPS) \
		--output.file $@
	@echo -e " $(OK) $@ built"

compat.js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
		--config $(ROOT)/compat_config.js \
		--banner "/* $(PACKAGE)@$(VERSION) */" \
		--amd.id $(PACKAGE) \
		--name $(GLOBAL) \
		--globals $(DEPS) \
		--output.file $@
	@echo -e " $(OK) $@ built"

lint: _lint
test: _test
html: _html
clean: _clean
