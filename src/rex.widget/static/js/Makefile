BIN   				= ./node_modules/.bin
TESTS					= \
								lib/__tests__/*-test.js \
								lib/data/__tests__/*-test.js
MOCHA_OPTIONS = --compilers js:babel/register --require ./lib/__tests__/setup.js
MOCHA					= NODE_ENV=test node $(BIN)/mocha $(MOCHA_OPTIONS)

test::
	@$(MOCHA) -- $(TESTS)

ci::
	@$(MOCHA) --watch -- $(TESTS)

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/
