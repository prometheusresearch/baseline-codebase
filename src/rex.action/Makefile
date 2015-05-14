.PHONY: test

TESTS = $(wildcard test/*.rst)

test/%.tested: test/%.rst
	@echo 'Running $<'
	@python -m doctest $<

test: $(TESTS:%.rst=%.tested)
