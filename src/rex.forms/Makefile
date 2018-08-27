demo-init::
	../../bin/pip install -e ../rex.instrument/demo
	../../bin/pip install -e ./demo
	../../bin/rex deploy rex.forms_demo
	../../bin/yarn --cwd=./demo/js
	../../bin/yarn --cwd=./demo/js build
	mkdir -p ./demo/static/www
	ln -s ../../js/build ./demo/static/www/bundle

demo::
	../../bin/honcho start

lint::
	../../bin/tidypy check

