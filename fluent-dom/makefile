PACKAGE := fluent-dom

include ../common.mk

build: $(PACKAGE).js

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
		  --format es \
	    --output $@
	@echo -e " $(OK) $@ built"


clean:
	@rm -f $(PACKAGE).js
	@echo -e " $(OK) clean"
