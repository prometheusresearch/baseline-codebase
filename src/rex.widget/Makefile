demo::
	@rex serve --watch --debug rex.widget_demo

shell::
	@rex python rex.widget_demo

doc::
	@sphinx-build -b html doc doc/_build

install develop::
	@python setup.py $@

test:: unittest doctest

lint::
	pylint src/rex/widget

unittest::
	@py.test $(shell find ./src -name '*_tests.py')

doctest::
	@python -m doctest $(shell find ./test -name '*.rst')
