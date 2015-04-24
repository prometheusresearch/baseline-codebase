.PHONY: deploy serve

APP = rex.workflow_demo
OPTIONS = \
		--set=attach_dir=/tmp

deploy:
	rex deploy $(OPTIONS) $(APP)

pyshell:
	rex pyshell $(OPTIONS) $(APP)

serve:
	rex serve $(OPTIONS) $(APP)
