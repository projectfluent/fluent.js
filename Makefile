MOCHA_OPTS=
REPORTER?=dot

test: test-compiler

test-lib: 
	@./node_modules/.bin/mocha \
		--require should \
		--reporter $(REPORTER) \
		tests/lib/*.js

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

coverage: docs/coverage.html

docs/coverage.html: _build/cov
	@L20N_COV=1 $(MAKE) test REPORTER=html-cov > docs/coverage.html

_build/cov: lib
	@rm -rf _build/cov
	@mkdir _build/cov
	@jscoverage lib _build/cov/lib

docs: lib html
	./node_modules/docco/bin/docco --output docs/lib lib/*.js
	./node_modules/docco/bin/docco --output docs/html html/*.js
	@touch docs

gh-pages: docs
	./_build/gh-pages.sh

.PHONY: test test-compiler watch-compiler coverage gh-pages
