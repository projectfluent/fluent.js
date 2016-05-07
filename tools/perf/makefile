perf: perf-jsshell

# alias for % to match correctly
src/runtime/jsshell: src/runtime/tooling

perf-%: src/runtime/%
	@./tools/perf/test.js -e $* -s 30 -p

perf-compare-%: src/runtime/%
	@./tools/perf/test.js -e $* -s 30 -p -c $(PERF_REFERENCE)

perf-reference-%: src/runtime/%
	@./tools/perf/test.js -e $* -s 30 -r > $(PERF_REFERENCE)
