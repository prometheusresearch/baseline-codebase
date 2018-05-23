BIN           = ./node_modules/.bin
TESTS         = \
                lib/__tests__/*-test.js \
                lib/data/__tests__/*-test.js \
                lib/datatable/__tests__/*-test.js \
                lib/form/__tests__/*-test.js \
                lib/lang/__tests__/*-test.js \
                lib/ui/__tests__/*-test.js \
                lib/ui/base/__tests__/*-test.js
MOCHA_OPTS    = --compilers js:babel-core/register --require babel-polyfill --require ./lib/__tests__/setup.js
MOCHA         = NODE_ENV=test $(BIN)/mocha $(MOCHA_OPTS)
COV_OPTS      = --require babel-polyfill --require babel-core/register --all --root lib
COV           = NODE_ENV=test $(BIN)/nyc $(COV_OPTS) $(BIN)/_mocha --require ./lib/__tests__/setup.js

test::
	@$(MOCHA) -- $(TESTS)

test-cov::
	@$(COV) -- $(TESTS)

report-cov::
	@$(COV) -- $(TESTS) || $(BIN)/nyc report -r html

ci::
	@$(MOCHA) --watch -- $(TESTS)

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/
