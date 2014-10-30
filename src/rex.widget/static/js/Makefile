BIN   = ./node_modules/.bin
TESTS = $(shell find ./lib -path '**/__tests__/*.js')

test:: unit-test

ci:: unit-ci

unit-ci::
	@$(BIN)/mochify --watch -R dot $(TESTS)

unit-test::
	@$(BIN)/mochify -R dot $(TESTS)
