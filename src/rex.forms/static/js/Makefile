TESTS ?= ./tests/integration/index.js

lint:
	@./node_modules/.bin/eslint-jsx lib/

ci:
	export PATH=./node_modules/.bin:$$PATH; webpack-dev-server \
		$(TESTS:%=mocha!%) \
		--bail \
		--quiet \
		--devtool 'eval' \
		--port 8888 \
		--output-file test.js
