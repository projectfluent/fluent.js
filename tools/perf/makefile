PERF_ENGINE ?= jsshell

.PHONY: perf
perf:
	@./tools/perf/test.js -e $(PERF_ENGINE) -s 30 -p

.PHONY: perf-compare
perf-compare:
	@./tools/perf/test.js -e $(PERF_ENGINE) -s 30 -p -c $(PERF_REFERENCE)

.PHONY: perf-reference
perf-reference:
	@./tools/perf/test.js -e $(PERF_ENGINE) -s 30 -r
