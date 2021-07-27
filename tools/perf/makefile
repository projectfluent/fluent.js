perf: perf-node

perf-%:
	@./test.js -e $* -s 30 -p

perf-compare-%:
	@./test.js -e $* -s 30 -p -c $(PERF_REFERENCE)

perf-reference-%:
	@./test.js -e $* -s 30 -r > $(PERF_REFERENCE)
