.PHONY: deploy serve

APP = rex.workflow_demo
OPTIONS = --debug

deploy:
	rex deploy $(OPTIONS) $(APP)

pyshell:
	rex pyshell $(OPTIONS) $(APP)

serve:
	rex serve --watch $(OPTIONS) $(APP)
