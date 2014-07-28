demo::
	@rex serve rex.widget_demo

install develop::
	@python setup.py $@

test:: unittest doctest

unittest::
	@py.test ./test

doctest::
	@python -m doctest $(shell find ./test -name '*.rst')
