BIN           = ./node_modules/.bin
TESTS         = \
                lib/__tests__/Entity-test.js
MOCHA_OPTS    = --compilers js:babel/register
MOCHA         = NODE_ENV=test $(BIN)/mocha $(MOCHA_OPTS)
COV_OPTS      = --check-coverage --require babel/register --all --root lib
COV           = NODE_ENV=test $(BIN)/nyc $(COV_OPTS) $(BIN)/_mocha

test::
	@$(MOCHA) -- $(TESTS)

test-cov::
	@$(COV) -- $(TESTS)

ci::
	@$(MOCHA) --watch -- $(TESTS)

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/
