BIN = $(CURDIR)/node_modules/.bin

test::
	$(BIN)/jest

test-cov::
	$(BIN)/jest --coverage

ci::
	$(BIN)/jest --watch

lint::
	@$(BIN)/eslint $(CURDIR)/lib/

lint-errors-only::
	@$(BIN)/eslint --quiet $(CURDIR)/lib/
