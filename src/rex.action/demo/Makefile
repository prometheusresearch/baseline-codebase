.PHONY: deploy serve

APP = rex.action_demo
OPTIONS = --debug --set=attach_dir=/tmp/files

deploy pyshell shell:
	rex $@ $(OPTIONS) $(APP)

serve:
	rex serve --watch $(OPTIONS) $(APP)
