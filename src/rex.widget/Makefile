demo::
	@pip install -e demo
	@rex deploy rex.widget_demo
	@$(MAKE) -C ./demo

doc::
	@sphinx-build doc doc/_build

install develop::
	@python setup.py $@

lint::
	pylint src/rex/widget

test-fast::
	@$(foreach test, \
		$(wildcard test/formfield/*.rst) $(wildcard test/*.rst), \
		echo 'Running $(test)'; \
		python -m doctest $(test);)

test::
	@pbbt
