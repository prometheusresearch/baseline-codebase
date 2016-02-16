BIN           = ./node_modules/.bin
TESTS         = \
                lib/__tests__/*-test.js \
                lib/data/__tests__/*-test.js \
                lib/form/__tests__/*-test.js
MOCHA_OPTIONS = --compilers js:babel/register --require ./lib/__tests__/setup.js
MOCHA         = NODE_ENV=test node $(BIN)/mocha $(MOCHA_OPTIONS)
COV_OPTIONS   = --root ./lib --include-all-sources --excludes __tests__
COV           = NODE_ENV=test node $(BIN)/isparta cover $(COV_OPTIONS) \
                $(BIN)/_mocha $(MOCHA_OPTIONS)

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
