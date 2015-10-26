BIN 					= node_modules/.bin
TESTS					= lib/__tests__/Entity-test.js
MOCHA_OPTIONS = --compilers js:babel/register
MOCHA					= NODE_ENV=test node $(BIN)/mocha $(MOCHA_OPTIONS)

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/

test::
	@$(MOCHA) -- $(TESTS)

ci::
	@$(MOCHA) --watch -- $(TESTS)
