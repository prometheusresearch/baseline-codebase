
# Lists of source packages.
include Makefile.src


# The URL of the docker registry.
REGISTRY ?=


# Project name and version (codebase name / tag or revision id).
PRJ_NAME ?= ${shell hg identify -b | cut -d / -f 1}
PRJ_VER ?= ${firstword ${shell hg identify -t | cut -d / -f 2 -s} ${shell hg identify -i | tr + -}}


# Display available targets.
default:
	@echo "Available targets:"
	@echo "make init                    initialize the development environment (in container)"
	@echo "make init-local              initialize the development environment (in place)"
	@echo "make up                      start containers"
	@echo "make down                    stop containers"
	@echo "make purge                   stop containers and remove generated containers and volumes"
	@echo "make develop                 recompile source packages"
	@echo "make test                    test all source packages (specify PKG=<package> to test a single package)"
	@echo "make dist                    build the docker image for distribution"
	@echo "make upload REGISTRY=<URL>   upload the distribution image to the registry"
	@echo "make shell                   opens a bash shell in the application container"
	@echo "make capture-updated         copies updated files from the application container to the local filesystem"
.PHONY: default


# Initialize the development environment in a docker container.
init:
	@if [ -e bin/activate ]; then echo "${RED}The development environment is already initialized!${NORM}"; false; fi
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Bootstrapping Docker-based environment...${NORM}"
	${MAKE} init-cfg up init-sync init-remote init-bin
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
.PHONY: init


# Initialize the development environment in-place.
init-local:
	@if [ -e bin/activate ]; then echo "${RED}The development environment is already initialized!${NORM}"; false; fi
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Bootstrapping local environment...${NORM}"
	${MAKE} init-cfg init-env init-dev develop
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
.PHONY: init-local


# Enable default configuration.
init-cfg:
	@for src in default/.* default/*; do \
		dst=$$(basename $$src); \
		if [ ! -f $$src ]; then continue; fi; \
		if [ -e $$dst ]; then continue; fi; \
		echo "Copying $$src -> $$dst"; \
		cp -a $$src $$dst; \
	done
.PHONY: init-cfg


# Synchronize the source tree.
init-sync:
	-docker-compose exec develop \
		rsync --delete --exclude /.hg/ --exclude /bin/ --exclude /data/ --exclude /run/ --exclude /doc/build/ \
		--ignore-errors --links --recursive --times \
		/repo/ /app/
.PHONY: init-sync


# Initialize the environment in the container.
init-remote:
	docker-compose exec develop make init-env init-dev develop
.PHONY: init-remote


# Populate the local ./bin/ directory.
init-bin:
	mkdir -p bin
	echo "$$ACTIVATE_TEMPLATE" >./bin/activate
	echo "$$COMPOSE_TEMPLATE" >./bin/docker-compose
	chmod a+x ./bin/docker-compose
	echo "$$RSH_TEMPLATE" >./bin/rsh
	chmod a+x ./bin/rsh
	for exe in $$(docker-compose exec develop find bin '!' -type d -executable | tr -d '\r'); do \
		ln -s -f rsh $$exe; \
	done
.PHONY: init-bin


# Create the environment.
init-env:
	python3 -m venv ${CURDIR}
	${CURDIR}/bin/pip install wheel==0.31.1
	npm --global --prefix ${CURDIR} install yarn@1.9.2
.PHONY: init-env


REQUIRED_TOOL_PY = \
	pbbt==0.1.6 \
	coverage==4.5.1 \
	pytest==3.6.4

# Install development tools.
init-dev:
	./bin/pip --isolated install ${REQUIRED_TOOL_PY} ${TOOL_PY}
	echo "$$PBBT_TEMPLATE" >./bin/pbbt
	chmod a+x ./bin/pbbt
	@if [ ! -z "${TOOL_JS}" ]; then \
		npm --global --prefix ${CURDIR} install ${TOOL_JS} ; \
	fi
	mkdir -p ./data/attach
	mkdir -p ./run
	ln -sf ./run/socket ./socket
.PHONY: init-dev


# Start Docker containers.
up:
	docker-compose up -d
.PHONY: up


# Stop Docker containers.
down:
	docker-compose down
.PHONY: down


# Remove generated containers and volumes.
purge:
	docker-compose down -v --remove-orphans
	rm -rf bin
.PHONY: purge


# Open up a shell in the develop container
shell: ./bin/activate
	docker-compose exec develop /bin/bash
.PHONY: shell


# Check that the development environment is initialized.
./bin/activate:
	@echo "${RED}Run \"make init\" or \"make init-local\" to initialize the development environment.${NORM}"; false


# Compile JavaScript source packages.
build-js: ./bin/activate
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building Javascript packages...${NORM}"
	set -ex; \
	if [ -z "$$TMPDIR" ]; then export TMPDIR=/tmp; fi; \
	for src in ${SRC_JS}; do \
		./bin/yarn --cwd $$src; \
		./bin/yarn --cwd $$src run build; \
	done
.PHONY: build-js


# Build generic, make-based projects.
build-generic: ./bin/activate
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building generic projects...${NORM}"
	for src in ${SRC_MAKE}; do \
		base=$$(echo $$src | cut -d : -f 1); \
		target=$$(echo $$src | cut -d : -f 2); \
		${MAKE} -C $$base $$target; \
	done
.PHONY: build-generic


# Build the repository-level documentation
build-docs: ./bin/activate
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building repository documentation...${NORM}"
	if [ -e "doc/Makefile" ]; then \
		${MAKE} -C doc html; \
	fi
.PHONY: build-docs


# Compile source packages in development mode.
develop: ./bin/activate
	${MAKE} build-js
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building Python packages...${NORM}"
	set -ex; \
	for src in ${SRC_PY}; do \
		./bin/pip --isolated install --editable $$src; \
	done
	${MAKE} build-generic
	${MAKE} build-docs
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Linking data files...${NORM}"
	set -ex; \
	for src in ${SRC_DATA}; do \
		from=$$(echo $$src | cut -d : -f 1); \
		to=$$(echo $$src | cut -d : -f 2); \
		mkdir -p $$(dirname $$to); \
		rm -f $$to; \
		ln -s ${CURDIR}/$$from $$to; \
	done
.PHONY: develop


# Compile and install source packages.
install: ./bin/activate
	${MAKE} build-js
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building Python packages...${NORM}"
	set -ex; \
	for src in ${SRC_PY}; do \
		./bin/pip --isolated install $$src; \
	done
	${MAKE} build-generic
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Copying data files...${NORM}"
	set -ex; \
	for src in ${SRC_DATA}; do \
		from=$$(echo $$src | cut -d : -f 1); \
		to=$$(echo $$src | cut -d : -f 2); \
		mkdir -p $$(dirname $$to); \
		cp -aT $$from $$to; \
	done
.PHONY: install


# Test source packages.
test: ./bin/activate
	@FAILURES=; \
	for src in ${TEST_PY}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			if [ -e $$src/test/input.yaml ]; then \
				echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
				if [ -z "${VERBOSE}" ]; then ARGS="--quiet" ; fi ;\
				(cd $$src; ${CURDIR}/bin/pbbt $$ARGS --max-errors=0); \
				if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
			fi; \
		fi; \
	done; \
	for src in ${TEST_JS}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
			(${CURDIR}/bin/yarn --cwd=$$src run test); \
			if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
		fi; \
	done; \
	for src in ${TEST_MAKE}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
			(docker-compose exec develop make -C $$src test); \
			if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
		fi; \
	done; \
	if [ -n "$$FAILURES" ]; then \
		echo "${RED}`date '+%Y-%m-%d %H:%M:%S%z'` Testing failed:" $$FAILURES "${NORM}"; \
		false; \
	else \
		echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` Testing complete${NORM}"; \
   	fi
.PHONY: test


# Retrieve files updated in the container and copy them locally.
capture-updated: ./bin/activate
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Searching for files updated in the container..."; \
	UPDATED= ;\
	CONTAINER=$$(docker-compose ps --quiet develop) ;\
	for mask in ${CAPTURE_MASKS}; do \
		for match in $$(docker-compose exec -T develop find . -type f -regex $$mask); do \
			tmp=$$(mktemp) ;\
			docker cp $$CONTAINER:/app/$$match $$tmp ;\
			diff -N $$match $$tmp > /dev/null ;\
			if [ $$? -ne 0 ]; then \
				cat $$tmp > $$match ;\
				UPDATED="$$UPDATED $$match" ;\
			fi ;\
			rm $$tmp ;\
		done ;\
	done ;\
	if [ -z "$$UPDATED" ]; then \
		echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` No updated files found." ;\
	else \
		echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` Found updated files:" $$UPDATED "${NORM}"; \
   	fi
.PHONY: capture-updated


# Build the application docker image for distribution.
dist:
	docker build --force-rm -t rexdb/${PRJ_NAME}:${PRJ_VER} .
.PHONY: dist


# Install the application.
dist-local:
	${MAKE} init-env install
.PHONY: dist-local


# Upload the distribution image.
upload:
	@if [ -z "${REGISTRY}" ]; then echo "${RED}REGISTRY is not set!${NORM}"; false; fi
	docker tag rexdb/${PRJ_NAME}:${PRJ_VER} ${REGISTRY}/${PRJ_NAME}:${PRJ_VER}
	docker push ${REGISTRY}/${PRJ_NAME}:${PRJ_VER}
.PHONY: upload


# Colors.
NORM = ${shell tput sgr0}
RED = ${shell tput setaf 1}
GREEN = ${shell tput setaf 2}
BLUE = ${shell tput setaf 4}


# Templates for ./bin/activate and other generated scripts.
define ACTIVATE_TEMPLATE
VIRTUAL_ENV="${CURDIR}"
export VIRTUAL_ENV

deactivate () {
	unset -f up down

	if ! [ -z "$${_OLD_VIRTUAL_PS1+_}" ] ; then
		PS1="$$_OLD_VIRTUAL_PS1"
		export PS1
		unset _OLD_VIRTUAL_PS1
	fi

	if ! [ -z "$${_OLD_VIRTUAL_PATH+_}" ] ; then
		PATH="$$_OLD_VIRTUAL_PATH"
		export PATH
		unset _OLD_VIRTUAL_PATH
	fi

	if [ -n "$${BASH-}" ] || [ -n "$${ZSH_VERSION-}" ] ; then
		hash -r 2>/dev/null
	fi

	unset VIRTUAL_ENV
	unset -f deactivate
}

_OLD_VIRTUAL_PS1="$$PS1"
PS1="[`basename \"$$VIRTUAL_ENV\"`] $$PS1"
export PS1

_OLD_VIRTUAL_PATH="$$PATH"
PATH="$$VIRTUAL_ENV/bin:$$PATH"
export PATH

if [ -n "$${BASH-}" ] || [ -n "$${ZSH_VERSION-}" ] ; then
	hash -r 2>/dev/null
fi
endef

define COMPOSE_TEMPLATE
#!/bin/sh
cd "${CURDIR}" && PATH="${PATH}" exec "${shell which docker-compose}" "$$@"
endef

define PBBT_TEMPLATE
#!${CURDIR}/bin/python3

import os, re, sys
from pbbt import main

os.environ['HOME'] = '${CURDIR}'
os.environ['PATH'] = '${CURDIR}/bin:' + os.environ.get('PATH', '')

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw?|\.exe)?$$', '', sys.argv[0])
    sys.exit(main())
endef

define RSH_TEMPLATE
#!/bin/sh

set -e

if ! [ -z "$${_OLD_VIRTUAL_PATH+_}" ] ; then
	PATH="$$_OLD_VIRTUAL_PATH"
	export PATH
	unset _OLD_VIRTUAL_PATH
fi

SCRIPTNAME="$$(basename "$$0")"
REMOTECMD="/app/bin/$$SCRIPTNAME $$@"
if [ "$$SCRIPTNAME" = rsh ]; then
	if [ $$# -eq 0 ]; then
		REMOTECMD=/bin/bash
	else
		REMOTECMD="$$@"
	fi
fi

SCRIPTDIR="$$(dirname "$$0")"
LOCALDIR="$$(pwd)"
cd "$$SCRIPTDIR/.."
ROOTDIR="$$(pwd)/"
REMOTEDIR="$${LOCALDIR#$$ROOTDIR}"

if [ "$$REMOTEDIR" = "$$LOCALDIR" ]; then
	set -x
	exec docker-compose exec develop $$REMOTECMD
else
	set -x
	exec docker-compose exec develop sh -ce "cd ./$$REMOTEDIR && exec $$REMOTECMD"
fi
endef

export ACTIVATE_TEMPLATE COMPOSE_TEMPLATE PBBT_TEMPLATE RSH_TEMPLATE

