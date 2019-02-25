BIN           = ./node_modules/.bin
TESTS         = $(shell find lib -path '*/__tests__/*-test.js')
MOCHA_OPTIONS = --reporter dot --compilers js:babel-core/register

test:
	@$(BIN)/mocha $(MOCHA_OPTIONS) $(TESTS)

test-watch:
	@$(BIN)/mocha $(MOCHA_OPTIONS) --watch $(TESTS)

lint:
	@$(BIN)/eslint ./lib

check:
	@$(BIN)/flow ./lib

