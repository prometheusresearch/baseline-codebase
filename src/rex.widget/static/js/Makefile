BIN   = ./node_modules/.bin

lint::
	@$(BIN)/eslint ./lib/

lint-errors-only::
	@$(BIN)/eslint --quiet ./lib/

test:
	@REX_SETUP_DEV=yes $(BIN)/webtest

ci:
	@REX_SETUP_DEV=yes $(BIN)/webtest --watch
