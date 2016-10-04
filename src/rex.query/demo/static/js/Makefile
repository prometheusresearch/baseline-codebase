PQueryATH := ./node_modules/.bin:$(PATH)

export PATH

build-grammar: src/parsing/grammar.js

src/parsing/grammar.js: src/parsing/grammar.pegjs
	@pegjs -O speed -o $@ $<

install:
	npm install

start:
	@react-scripts start

lint:
	@eslint ./src

test:
	@react-scripts test

test-cov:
	@react-scripts test --coverage

ci:
	@react-scripts test --watch

check:
	@flow

build:
	@react-scripts build
