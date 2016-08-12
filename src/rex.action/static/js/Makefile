BIN           = $(CURDIR)/node_modules/.bin
TESTS         = \
                lib/__tests__/*-test.js \
                lib/actions/__tests__/*-test.js \
                lib/ui/__tests__/*-test.js \
                lib/execution/__tests__/*-test.js \
                lib/wizard/__tests__/*-test.js
MOCHA_OPTS    = --compilers js:$(CURDIR)/babel-setup --require babel-polyfill --require $(CURDIR)/lib/__tests__/setup.js
MOCHA         = NODE_PATH=$(CURDIR)/node_modules NODE_ENV=test $(BIN)/mocha $(MOCHA_OPTS)
COV_OPTS      = --check-coverage --require babel-polyfill --require $(CURDIR)/babel-setup --all --root lib
COV           = NODE_PATH=$(CURDIR)/node_modules NODE_ENV=test $(BIN)/nyc $(COV_OPTS) $(BIN)/_mocha --require $(CURDIR)/lib/__tests__/setup.js

test::
	@$(MOCHA) -- $(TESTS)

test-cov::
	@$(COV) -- $(TESTS)

report-cov::
	@$(BIN)/nyc report -r html

ci::
	@$(MOCHA) --watch -- $(TESTS)

lint::
	@$(BIN)/eslint $(CURDIR)/lib/

lint-errors-only::
	@$(BIN)/eslint --quiet $(CURDIR)/lib/
