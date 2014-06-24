TESTS ?= ./tests/integration/index.js

lint:
	@./node_modules/.bin/eslint-jsx lib/

ci:
	@webpack-dev-server \
		$(TESTS:%=mocha!%) \
		--bail \
		--quiet \
		--devtool 'eval' \
		--output-file test.js
