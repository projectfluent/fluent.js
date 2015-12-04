export SHELL := /bin/bash
export PATH  := node_modules/.bin:$(PATH)

lint:
	eslint src/

.PHONY: lint
