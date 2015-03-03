demo::
	@rex serve --watch --debug rex.widget_demo

shell::
	@rex python rex.widget_demo

doc::
	@sphinx-build doc doc/_build

install develop::
	@python setup.py $@

test:: unittest doctest

lint::
	pylint src/rex/widget

unittest::
	@py.test $(shell find ./src -name '*_tests.py')
	@#py.test ./src

doctest::
	@python -m doctest $(shell find ./test -name '*.rst')


install_demo:
	../bin/pip install -i https://pypi.python.org/simple \
	  https://bitbucket.org/rexdb/htsql-rexdb/downloads/HTSQL-2.3.3.20150130.tar.gz 
	../bin/pip install -i https://pypi.python.org/simple \
	  https://bitbucket.org/rexdb/htsql-rexdb/downloads/HTSQL-PGSQL-2.3.3.20150130.tar.gz 
	../bin/pip install -i https://pypi.python.org/simple \
	  -e hg+ssh://hg@bitbucket.org/rexdb/rex.setup#egg=rex.setup
	cat tip2.txt | awk '/rex/ {print "cd ../src/ && hg clone ssh://hg@bitbucket.org/rexdb/" $$$$1  }' | bash
	cat tip2.txt | awk '/rex/ {print "cd ../src/ && ../bin/pip install -e " $$$$1  }' | bash
	../bin/pip install -e .
	../bin/pip install -e demo/

