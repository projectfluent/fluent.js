perf: perf-jsshell

perf-%: build
	@./tools/perf/test.js -e $* -s 30 -p

perf-compare-%: build
	@./tools/perf/test.js -e $* -s 30 -p -c $(PERF_REFERENCE)

perf-reference-%: build
	@./tools/perf/test.js -e $* -s 30 -r > $(PERF_REFERENCE)
