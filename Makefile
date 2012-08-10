MOCHA_OPTS=
REPORTER?=dot

test: test-compiler

test-compiler:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter $(REPORTER) \
		tests/compiler/*.js

watch-compiler:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter min \
		--watch \
		--growl \
		tests/compiler/*.js

test-cov: lib-cov
	@L20N_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

.PHONY: test test-compiler watch-compiler
