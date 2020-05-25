BIN = $(PWD)/node_modules/.bin
FMT = flow-typed rex-graphql rex-ui rex-demo-ui

test:
	@yarn run jest --no-watch --no-watchman

install:
	@yarn
	@yarn --cwd ./rex-graphql-codegen run build

showcase:
	@yarn run cosmos

storybook: 
	@yarn run storybook

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
