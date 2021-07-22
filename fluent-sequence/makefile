PACKAGE := @fluent/sequence
GLOBAL  := FluentSequence

include ../common.mk

lint:
	@$(ESLINT) --max-warnings 0 src/ test/
	@echo -e " $(OK) lint"

.PHONY: compile
compile: esm/.compiled

esm/.compiled: $(SOURCES)
	@$(TSC)
	@echo '{ "type": "module" }' > esm/package.json
	@touch $@
	@echo -e " $(OK) esm/ compiled"

.PHONY: test
test: esm/.compiled
	@$(MOCHA_CMD)

.PHONY: build
build: index.js

index.js: esm/.compiled
	@$(ROLLUP_CMD) $@
	@echo -e " $(OK) $@ built"

html:
	@$(TYPEDOC_CMD)
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf $(DOC_DESTINATION)
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
