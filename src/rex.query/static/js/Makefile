BIN = ./node_modules/.bin


build-grammar: src/parsing/grammar.js

src/parsing/grammar.js: src/parsing/grammar.pegjs
	@$(BIN)/pegjs -O speed -o $@ $<

install:
	npm install

start:
	@$(BIN)/react-scripts start

lint:
	@$(BIN)/eslint ./src

test:
	@$(BIN)/jest

test-cov:
	@$(BIN)/jest test --coverage

ci:
	@$(BIN)/jest --watch

check:
	@$(BIN)/flow --show-all-errors

check-cov:
	@$(BIN)/flow-coverage-report -i 'src/**/*.js' -x 'src/__tests__/**'


build:
	@$(BIN)/react-scripts build

