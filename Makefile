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

test-cov: docs/coverage.html

docs/coverage.html: lib-cov
	L20N_COV=1 $(MAKE) test REPORTER=html-cov > docs/coverage.html

lib-cov: lib
	@rm -rf lib-cov
	@jscoverage lib lib-cov

docs: lib html
	./node_modules/docco/bin/docco --output docs/lib lib/*.js
	./node_modules/docco/bin/docco --output docs/html html/*.js
	@touch docs

.PHONY: test test-compiler watch-compiler test-cov
