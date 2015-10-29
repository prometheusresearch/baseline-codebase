.PHONY: test

TESTS = $(wildcard test/*.rst) $(wildcard test/actions/*.rst)

demo::
	@make -C demo serve

doc::
	@sphinx-build doc doc/_build

test:
	@pbbt test/input.yaml test/output.yaml

test-fast::
	@$(foreach test, $(TESTS), \
		echo 'Running $(test)'; \
		python -m doctest $(test);)
