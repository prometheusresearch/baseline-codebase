.PHONY: test

TESTS = $(wildcard test/*.rst) $(wildcard test/actions/*.rst)

doc::
	@sphinx-build doc doc/_build

test:
	@pbbt test/input.yaml test/output.yaml

test-fast: $(TESTS:%.rst=%.tested)

test/%.tested: test/%.rst
	@echo 'Running $<'
	@python -m doctest $<
