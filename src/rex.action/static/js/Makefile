BIN = node_modules/.bin

test:
	@$(BIN)/webtest

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/

ci:
	@$(BIN)/webtest --watch
