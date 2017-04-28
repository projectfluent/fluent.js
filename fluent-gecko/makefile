PACKAGE := fluent-gecko

include ../common.mk

build: Fluent.jsm

Fluent.jsm: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --config xpcom_config.js \
	    --output $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -f Fluent.jsm
	@echo -e " $(OK) clean"
