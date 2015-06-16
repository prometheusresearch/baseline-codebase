.PHONY: deploy serve

APP = rex.action_demo
OPTIONS = --debug

deploy pyshell shell:
	rex $@ $(OPTIONS) $(APP)

serve:
	rex serve --watch $(OPTIONS) $(APP)
