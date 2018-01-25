perf: perf-node

perf-%:
	@./tools/perf/test.js -e $* -s 30 -p

perf-compare-%:
	@./tools/perf/test.js -e $* -s 30 -p -c $(PERF_REFERENCE)

perf-reference-%:
	@./tools/perf/test.js -e $* -s 30 -r > $(PERF_REFERENCE)
