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
	@$(BIN)/react-scripts test

test-cov:
	@$(BIN)/react-scripts test --coverage

ci:
	@$(BIN)/react-scripts test --watch

check:
	@$(BIN)/flow --show-all-errors

build:
	@$(BIN)/react-scripts build

