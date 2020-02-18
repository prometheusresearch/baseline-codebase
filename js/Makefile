BIN = $(PWD)/node_modules/.bin
FMT = flow-typed rex-graphql rex-ui rex-demo-ui

test:
	@yarn run jest --no-watch --no-watchman

install:
	@yarn

showcase:
	@yarn run cosmos

check:
	@yarn run flow

fmt:
	@yarn prettier --write $(FMT:%='%/**/*.{js,gql}')

check-fmt:
	@yarn prettier --check $(FMT:%='%/**/*.js')
