perf: perf-jsshell

perf-%:
	@$(MAKE) -s build
	@./tools/perf/test.js -e $* -s 30 -p

perf-compare-%:
	@$(MAKE) -s build
	@./tools/perf/test.js -e $* -s 30 -p -c $(PERF_REFERENCE)

perf-reference-%:
	@$(MAKE) -s build
	@./tools/perf/test.js -e $* -s 30 -r > $(PERF_REFERENCE)
