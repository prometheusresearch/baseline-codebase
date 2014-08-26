BIN   = ./node_modules/.bin
PATH := $(BIN):$(PATH)
TESTS = $(shell find ./lib -path '**/__tests__/*.js')

test:: unit-test

ci:: unit-ci

unit-ci::
	@mochify --watch -R dot $(TESTS)

unit-test::
	@mochify -R dot $(TESTS)
