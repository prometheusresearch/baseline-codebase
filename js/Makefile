BIN = $(PWD)/node_modules/.bin
FMT = flow-typed rex-graphql rex-ui rex-demo-ui

test:
	@yarn run jest --no-watch --no-watchman

install:
	@yarn

showcase:
	@yarn run cosmos

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
