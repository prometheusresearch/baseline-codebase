PQueryATH := ./node_modules/.bin:$(PATH)

export PATH

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
