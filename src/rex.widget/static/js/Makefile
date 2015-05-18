BIN   = ./node_modules/.bin
TESTS = $(shell find ./lib -path '**/__tests__/*.js')

test:
	@REX_SETUP_DEV=yes \
	 DEBUG=zuul-builder-webpack \
	 ./node_modules/.bin/zuul --local 8080 \
	 $(shell find lib/modern -name '*-tests.js')
