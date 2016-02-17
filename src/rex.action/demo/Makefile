.PHONY: deploy serve doc

APP = rex.action_demo
OPTIONS = --debug --set=attach_dir=/tmp/files

deploy pyshell shell:
	rex $@ $(OPTIONS) $(APP)

serve:
	rex serve --watch $(OPTIONS) $(APP)

doc:
	rm -rf static/www/doc && pip install -e .
