.PHONY: test

TESTS = $(shell find test -name '*.rst')

test/%.tested: test/%.rst
	@echo 'Running $<'
	@python -m doctest $<

test: $(TESTS:%.rst=%.tested)
