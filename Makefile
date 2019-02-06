
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
	@echo "make sync                    start synchronizing files with the container"
.PHONY: default


# Initialize the development environment in a docker container.
init:
	@if [ -e bin/activate ]; then echo "${RED}The development environment is already initialized!${NORM}"; false; fi
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Bootstrapping Docker-based environment...${NORM}"
	${MAKE} init-cfg up init-sync init-remote init-bin
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
	@echo "${GREEN}Run \"make sync\" to start synchronizing files with the container.${NORM}"
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


RSYNC = \
	rsync \
		--rsh "docker-compose exec -T" \
		--blocking-io --delete --ignore-errors --links --recursive --times --compress

# Synchronize the source tree.
init-sync:
	${RSYNC} \
		--exclude /.hg/ --exclude '.*.sw?' --exclude /bin/ --exclude /data/ --exclude /run/ --exclude /doc/build/ \
		./ develop:/app/
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
	for exe in $$(docker-compose exec -T develop find bin '!' -type d -executable); do \
		ln -s -f rsh $$exe; \
	done
.PHONY: init-bin


# Create the environment.
init-env:
	python3 -m venv ${CURDIR}
	${CURDIR}/bin/pip install wheel==0.32.3
	npm --global --prefix ${CURDIR} install yarn@1.12.3
.PHONY: init-env


REQUIRED_TOOL_PY = \
	pbbt==0.1.6 \
	coverage==4.5.2 \
	pytest==4.0.1

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


bin/syncthing:
	set -e; \
	ver=v1.0.0; \
	case "`uname -s`" in Linux) os=linux;; Darwin) os=macos;; *) os=undefined;; esac; \
	case "`uname -m`" in x86_64) arch=amd64;; *) arch=undefined;; esac; \
	curl -sL https://github.com/syncthing/syncthing/releases/download/$$ver/syncthing-$$os-$$arch-$$ver.tar.gz | \
	tar xz -C bin syncthing-$$os-$$arch-$$ver/syncthing; \
	mv bin/syncthing-$$os-$$arch-$$ver/syncthing bin; \
	rmdir bin/syncthing-$$os-$$arch-$$ver


bin/sync: bin/syncthing
	set -e; \
	mkdir -p .st/remote; \
	STNODEFAULTFOLDER=1 ./bin/syncthing -generate .st; \
	STNODEFAULTFOLDER=1 ./bin/syncthing -generate .st/remote; \
	LOCAL_ID=`./bin/syncthing -home=.st -device-id`; \
	REMOTE_ID=`./bin/syncthing -home=.st/remote -device-id`; \
	FOLDER_PATH="${CURDIR}" LISTEN_ADDRESS= GUI_ENABLED=false \
		eval "echo \"$$SYNCTHING_CONFIG_TEMPLATE\"" > .st/config.xml; \
	FOLDER_PATH=/app LISTEN_ADDRESS=tcp://0.0.0.0:22000 GUI_ENABLED=true \
		eval "echo \"$$SYNCTHING_CONFIG_TEMPLATE\"" > .st/remote/config.xml; \
	docker-compose exec develop make bin/syncthing; \
	${RSYNC} ./.st/remote/ develop:/app/.st/; \
	echo "$$SYNC_TEMPLATE" >./bin/sync; \
	chmod a+x ./bin/sync


# Start synchronizing files with the container.
sync: bin/sync
	@./bin/sync
.PHONY: sync


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

define SYNCTHING_CONFIG_TEMPLATE
<configuration version=\"28\">
    <folder id=\"codebase\" label=\"codebase\" path=\"$$FOLDER_PATH\" type=\"sendreceive\" rescanIntervalS=\"360\" fsWatcherEnabled=\"true\" fsWatcherDelayS=\"1\" ignorePerms=\"false\" autoNormalize=\"true\">
        <filesystemType>basic</filesystemType>
        <device id=\"$$LOCAL_ID\" introducedBy=\"\"></device>
        <device id=\"$$REMOTE_ID\" introducedBy=\"\"></device>
        <minDiskFree unit=\"%\">1</minDiskFree>
        <versioning></versioning>
        <copiers>0</copiers>
        <pullerMaxPendingKiB>0</pullerMaxPendingKiB>
        <hashers>0</hashers>
        <order>random</order>
        <ignoreDelete>false</ignoreDelete>
        <scanProgressIntervalS>0</scanProgressIntervalS>
        <pullerPauseS>0</pullerPauseS>
        <maxConflicts>10</maxConflicts>
        <disableSparseFiles>false</disableSparseFiles>
        <disableTempIndexes>false</disableTempIndexes>
        <paused>false</paused>
        <weakHashThresholdPct>25</weakHashThresholdPct>
        <markerName>.stfolder</markerName>
        <useLargeBlocks>false</useLargeBlocks>
    </folder>
    <device id=\"$$LOCAL_ID\" name=\"local\" compression=\"metadata\" introducer=\"false\" skipIntroductionRemovals=\"false\" introducedBy=\"\">
        <address>dynamic</address>
        <paused>false</paused>
        <autoAcceptFolders>false</autoAcceptFolders>
        <maxSendKbps>0</maxSendKbps>
        <maxRecvKbps>0</maxRecvKbps>
        <maxRequestKiB>0</maxRequestKiB>
    </device>
    <device id=\"$$REMOTE_ID\" name=\"remote\" compression=\"metadata\" introducer=\"false\" skipIntroductionRemovals=\"false\" introducedBy=\"\">
        <address>tcp://127.0.0.1:22000</address>
        <paused>false</paused>
        <autoAcceptFolders>false</autoAcceptFolders>
        <maxSendKbps>0</maxSendKbps>
        <maxRecvKbps>0</maxRecvKbps>
        <maxRequestKiB>0</maxRequestKiB>
    </device>
    <gui enabled=\"$$GUI_ENABLED\" tls=\"false\" debugging=\"false\">
        <address>0.0.0.0:8384</address>
        <apikey>-</apikey>
        <theme>default</theme>
    </gui>
    <ldap></ldap>
    <options>
        <listenAddress>$$LISTEN_ADDRESS</listenAddress>
        <globalAnnounceServer>default</globalAnnounceServer>
        <globalAnnounceEnabled>false</globalAnnounceEnabled>
        <localAnnounceEnabled>false</localAnnounceEnabled>
        <localAnnouncePort>21027</localAnnouncePort>
        <localAnnounceMCAddr>[ff12::8384]:21027</localAnnounceMCAddr>
        <maxSendKbps>0</maxSendKbps>
        <maxRecvKbps>0</maxRecvKbps>
        <reconnectionIntervalS>60</reconnectionIntervalS>
        <relaysEnabled>false</relaysEnabled>
        <relayReconnectIntervalM>10</relayReconnectIntervalM>
        <startBrowser>false</startBrowser>
        <natEnabled>false</natEnabled>
        <natLeaseMinutes>60</natLeaseMinutes>
        <natRenewalMinutes>30</natRenewalMinutes>
        <natTimeoutSeconds>10</natTimeoutSeconds>
        <urAccepted>-1</urAccepted>
        <urSeen>3</urSeen>
        <urUniqueID></urUniqueID>
        <urURL>https://data.syncthing.net/newdata</urURL>
        <urPostInsecurely>false</urPostInsecurely>
        <urInitialDelayS>1800</urInitialDelayS>
        <restartOnWakeup>true</restartOnWakeup>
        <autoUpgradeIntervalH>0</autoUpgradeIntervalH>
        <upgradeToPreReleases>false</upgradeToPreReleases>
        <keepTemporariesH>24</keepTemporariesH>
        <cacheIgnoredFiles>false</cacheIgnoredFiles>
        <progressUpdateIntervalS>5</progressUpdateIntervalS>
        <limitBandwidthInLan>false</limitBandwidthInLan>
        <minHomeDiskFree unit=\"%\">1</minHomeDiskFree>
        <releasesURL>https://upgrades.syncthing.net/meta.json</releasesURL>
        <overwriteRemoteDeviceNamesOnConnect>false</overwriteRemoteDeviceNamesOnConnect>
        <tempIndexMinBlocks>10</tempIndexMinBlocks>
        <trafficClass>0</trafficClass>
        <defaultFolderPath>~</defaultFolderPath>
        <setLowPriority>true</setLowPriority>
        <minHomeDiskFreePct>0</minHomeDiskFreePct>
    </options>
</configuration>
endef

define SYNC_TEMPLATE
#!/bin/sh

status () {
    id=$$1
    [ -e ${CURDIR}/.st/$$id.pid ] && kill -0 `cat ${CURDIR}/.st/$$id.pid` > /dev/null 2>&1
}

start() {
    id=$$1
    shift
    "$$@" > ${CURDIR}/.st/$$id.log &
    echo $$! > ${CURDIR}/.st/$$id.pid
}

stop () {
    id=$$1
    if status $$id; then
        kill `cat ${CURDIR}/.st/$$id.pid`
        rm ${CURDIR}/.st/$$id.pid
    fi
}

remote_status () {
    id=$$1
    docker-compose exec -T develop sh -c '[ -e /app/.st/'$$id'.pid ] && kill -0 `cat /app/.st/'$$id'.pid` > /dev/null 2>&1'
}

remote_start() {
    id=$$1
    shift
	docker-compose exec -T develop sh -c "$$*"' > /app/.st/'$$id'.log 2>&1 & echo $$! > /app/.st/'$$id'.pid && wait' &
}

remote_stop () {
    id=$$1
    if remote_status $$id; then
		docker-compose exec -T develop sh -c 'kill `cat /app/.st/'$$id'.pid`; rm /app/.st/'$$id'.pid'
    fi
}

if status syncthing; then
    echo Already synchronizing...
    exit 1
fi

set -e

. ${CURDIR}/.env

trap "stop syncthing && remote_stop syncthing && echo && exit 0" INT TERM EXIT

remote_start syncthing /app/bin/syncthing -home=/app/.st -no-browser -no-restart

sed -i.bak "s/<address>tcp:\\\\/\\\\/127.0.0.1:.*<\\\\/address>/<address>tcp:\\\\/\\\\/127.0.0.1:$$SYNC_PORT<\\\\/address>/" ${CURDIR}/.st/config.xml

start syncthing ${CURDIR}/bin/syncthing -home=${CURDIR}/.st -no-browser -no-restart

echo "Synchronizing..."
wait
endef

export ACTIVATE_TEMPLATE COMPOSE_TEMPLATE PBBT_TEMPLATE RSH_TEMPLATE SYNCTHING_CONFIG_TEMPLATE SYNC_TEMPLATE

