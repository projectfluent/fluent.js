PACKAGE := fluent-gecko

include ../common.mk

build: Fluent.jsm
compat: ;

Fluent.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config xpcom_config.js \
	    --output $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f Fluent.jsm
	@rm -rf coverage
	@echo -e " $(OK) clean"
