demo::
	@rex serve --watch rex.widget_demo

doc::
	@sphinx-build doc doc/_build

install develop::
	@python setup.py $@

test:: unittest doctest

unittest::
	@py.test ./test

doctest::
	@python -m doctest $(shell find ./test -name '*.rst')
