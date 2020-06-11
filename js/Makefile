BIN = $(PWD)/node_modules/.bin
FMT = flow-typed rex-graphql rex-ui rex-demo-ui

test:
	@yarn run jest --no-watch --no-watchman

test-update:
	@yarn run jest --no-watch --no-watchman -u

install:
	@yarn
	@yarn --cwd ./rex-graphql-codegen run build

showcase:
	@yarn run cosmos

storybook: 
	@yarn run storybook

build: 
	@./node_modules/.bin/tsc --build

watch: 
	@./node_modules/.bin/tsc --build --watch

lint:
	@yarn run eslint --config ./.eslintrc .

check:
	@yarn run flow

fmt:
	@yarn prettier --write $(FMT:%='%/**/*.{js,gql}')

check-fmt:
	@yarn prettier --check $(FMT:%='%/**/*.js')

graphql-schema-dump:
	../bin/rex graphql-schema-dump rex.demo.ui rex.demo.ui.Schema > \
		./rex-demo-ui/graphql.api/schema.gql
