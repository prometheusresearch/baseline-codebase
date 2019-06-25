
# Lists of source packages.
include Makefile.*


# Development mode (local, docker, or kube).
DEVMODE = ${shell cat .devmode 2>/dev/null}


# The URL of the docker registry.
REGISTRY ?=


# Project name and version (codebase name / tag or revision id).
PRJ_NAME ?= ${shell hg identify -b | cut -d / -f 1}
PRJ_VER ?= ${firstword ${shell hg identify -t | cut -d / -f 2 -s} ${shell hg identify -i | tr + -}}


# Display available targets.
.DEFAULT_GOAL = help
help:
	@echo "Available targets:"
	@sed -n -e 's/^\([^:@]*\):.*#: \(.*\)/  make \1  |\2/p' Makefile Makefile.* | column -t -s '|'
.PHONY: help


# Initialize the development environment.
init: .devmode	#: initialize the development environment
	@if [ -e bin/activate ]; then echo "${RED}The development environment is already initialized!${NORM}"; false; fi
	${MAKE} --no-print-directory init-${DEVMODE}
.PHONY: init


# Initialize the development environment in-place.
init-local:
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Initializing the local development environment...${NORM}"
	[ -e .devmode ] || ${MAKE} configure-local
	${MAKE} init-cfg init-env develop
	@echo
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
	@echo
	@${MAKE} -s status
.PHONY: init-local


# Initialize the development environment in a Docker container.
init-docker:
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Initializing the development environment in a Docker container...${NORM}"
	[ -e .devmode ] || ${MAKE} configure-docker
	${MAKE} init-cfg up init-remote
	@echo
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
	@echo
	@${MAKE} -s status
.PHONY: init-docker


# Initialize the development environment in a Kubernetes cluster.
init-kube:
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Initializing the development environment in a Kubernetes cluster...${NORM}"
	[ -e .devmode ] || ${MAKE} configure-kube
	${MAKE} init-cfg up init-remote
	@echo
	@echo "${GREEN}`date '+%Y-%m-%d %H:%M:%S%z'` The development environment is ready!${NORM}"
	@echo
	@${MAKE} -s status
.PHONY: init-kube


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


# Initialize the environment in the container.
init-remote:
	mkdir -p bin
	echo "$$ACTIVATE_TEMPLATE" >./bin/activate
	echo "$$RSH_TEMPLATE" >./bin/rsh
	chmod a+x ./bin/rsh
	${MAKE} sync-once bin/sync
	${RSH} sh -ce "echo local > .devmode"
	${RSH} make init-env
	${MAKE} sync-bin
	${RSH} make develop
	${MAKE} sync-bin
.PHONY: init-remote


# Create the environment and install development tools.
init-env:
	python3 -m venv ${CURDIR}
	set -e; for tool in ${TOOL_PY}; do ./bin/pip --isolated install $$tool; done
	set -e; for tool in ${TOOL_JS}; do npm --global --prefix ${CURDIR} install $$tool; done
	echo "#!/bin/sh\n[ \$$# -eq 0 ] && exec \$$SHELL || exec \"\$$@\"" >./bin/rsh
	chmod a+x ./bin/rsh
	mkdir -p ./data/attach ./run
	ln -sf ./run/socket ./socket
.PHONY: init-env


# Show the configuration of the development environment.
status:	#: show the configuration of the development environment
	@[ -e .devmode -a -e ./bin/activate ] && \
	${MAKE} -s status-${DEVMODE} || \
	echo "${RED}Development environment is not initialized.${NORM}"
.PHONY: status


status-local:
	@echo "Development environment is initialized in the ${BOLD}local${NORM} mode."
	@[ "$$VIRTUAL_ENV" = "${CURDIR}" ] && \
	echo "The environment is active." || \
	echo "The environment is ${BOLD}${RED}not active${NORM}. To activate, run: ${CYAN}. ./bin/activate${NORM}"
	@echo
.PHONY: status-local


status-docker:
	@echo "Development environment is initialized in the ${BOLD}docker${NORM} mode."
	@[ "$$VIRTUAL_ENV" = "${CURDIR}" ] && \
	echo "The environment is active." || \
	echo "The environment is ${BOLD}${RED}not active${NORM}. To activate, run: ${CYAN}. ./bin/activate${NORM}"
	@PORT=$$(docker-compose port nginx 80 2>/dev/null | sed s/0.0.0.0://g) && [ -z "$$PORT" ] && \
	echo "Application container ${BOLD}${RED}is down${NORM}. To restart, run: ${CYAN}make up${NORM}" || \
	echo "The application is exposed at: ${CYAN}http://localhost:$$PORT${NORM}"
	@[ -e ${CURDIR}/.st/syncthing.pid ] && kill -0 `cat ${CURDIR}/.st/syncthing.pid` > /dev/null 2>&1 && \
	echo "Source code is being synchronized with the application container." || \
	echo "Source code is ${BOLD}${RED}not synchronized${NORM} with the application container. To synchronize, run: ${CYAN}make sync${NORM}"
	@echo "To delete the environment and free the associated resources, run: ${CYAN}make purge${NORM}"
	@echo
.PHONY: status-docker


status-kube:
	@echo "Development environment is initialized in the ${BOLD}kubernetes${NORM} mode."
	@[ "$$VIRTUAL_ENV" = "${CURDIR}" ] && \
	echo "The environment is active." || \
	echo "The environment is ${BOLD}${RED}not active${NORM}. To activate, run: ${CYAN}. ./bin/activate${NORM}"
	@DOMAIN=$$(kubectl get ingress develop -n ${NS} -o jsonpath="{.spec.rules[0].host}" 2>/dev/null) && \
	[ -n "$$DOMAIN" ] && \
	echo "The application is exposed at \"${CYAN}$$DOMAIN${NORM}\"." || \
	echo "Failed to determine how the application is exposed."
	@[ -e ${CURDIR}/.st/syncthing.pid ] && kill -0 `cat ${CURDIR}/.st/syncthing.pid` > /dev/null 2>&1 && \
	echo "Source code is being synchronized with the application container." || \
	echo "Source code is ${BOLD}${RED}not synchronized${NORM} with the application container. To synchronize, run: ${CYAN}make sync${NORM}"
	@echo "To delete the environment and free the associated resources, run: ${CYAN}make purge${NORM}"
	@echo
.PHONY: status-kube


# Restart the development environment.
up:	#: restart the environment
	${MAKE} up-${DEVMODE}
.PHONY: up


up-local:
.PHONY: up-local


up-docker:
	docker-compose up -d
	. ./.env && ${RSH} iptables -t nat -A OUTPUT -o lo -d 127.0.0.1 -p tcp --dport $$HTTP_PORT -j DNAT --to-destination `${NOTERM_RSH} dig +short nginx`:80
	${RSH} iptables -t nat -A POSTROUTING -j MASQUERADE
.PHONY: up-docker


up-kube:
	set -e; \
	if ! kubectl get namespace ${NS} >/dev/null 2>&1; then \
		if kubectl get namespace codebase-template >/dev/null 2>&1; then \
			kubectl get namespace codebase-template -o yaml | sed s/codebase-template/${NS}/g | kubectl apply -f -; \
			kubectl get configmap,secret,deployment,cronjob,service -n codebase-template -o yaml | sed s/codebase-template/${NS}/g | kubectl apply -f -; \
		else \
			kubectl create namespace ${NS}; \
		fi; \
	fi
	ZONE=$$(kubectl get namespace ${NS} -o jsonpath="{.metadata.annotations.zone}") && \
	ZONE=$${ZONE:-example.com} && \
	cat kube.yml | \
	sed s/develop.example.com/${NS}.$$ZONE/g | \
	kubectl apply -f -
	kubectl wait --for=condition=Ready --timeout=5m pod/develop


# Suspend the development environment.
down:	#: suspend the environment
	${MAKE} down-${DEVMODE}
.PHONY: down


down-local:
.PHONY: down-local


down-docker:
	docker-compose down
.PHONY: down-docker


down-kube:
.PHONY: down-kube


# Delete the development environment.
purge:	#: delete the environment and free the associated resources
	${MAKE} --no-print-directory purge-${DEVMODE}
.PHONY: purge


purge-local:
	rm -rf bin data include lib lib64 run share pyvenv.cfg socket
	for ws in ${WORKSPACE_JS}; do \
		find $$ws -depth -name node_modules -type d -exec rm -rf "{}" \; ;\
	done
.PHONY: purge-local


purge-docker:
	docker-compose down -v --remove-orphans
	rm -rf bin .st
.PHONY: purge-docker


purge-kube:
	-kubectl delete --grace-period=1 --all pod -n ${NS}
	-kubectl delete namespace ${NS}
	rm -rf bin .st
.PHONY: purge-kube


# Open up a shell in the develop container
shell: ./bin/activate	#: open a shell in the build container
	@if [ "${DEVMODE}" = "docker" -o "${DEVMODE}" = "kube" ]; then \
		./bin/rsh ;\
	else \
		echo "You're in ${BOLD}local${NORM} mode -- this does nothing." ;\
	fi;
.PHONY: shell


# Check that the development environment is initialized.
./bin/activate:
	@echo "${RED}Run \"make init\" to initialize the development environment.${NORM}"; false


# Compile JavaScript source packages.
build-js: ./bin/activate
	@echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Building Javascript packages...${NORM}"
	set -ex; \
	if [ -z "$$TMPDIR" ]; then export TMPDIR=/tmp; fi; \
	for ws in ${WORKSPACE_JS}; do \
		./bin/yarn --cwd $$ws; \
	done; \
	for src in ${SRC_JS}; do \
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
develop: ./bin/activate	#: recompile source packages
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
test: ./bin/activate	#: test all source packages (specify PKG=<SRC> to test a single package)
	@. ./bin/activate; \
	FAILURES=; \
	for src in ${TEST_PY}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			if [ -e $$src/test/input.yaml ]; then \
				echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
				if [ -z "${VERBOSE}" ]; then ARGS="--quiet" ; fi ;\
				(cd $$src; pbbt $$ARGS --max-errors=0); \
				if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
			fi; \
		fi; \
	done; \
	for ws in ${WORKSPACE_JS}; do \
		if [ -z "${PKG}" -o "$$ws" = "${PKG}" ]; then \
			if [ -e $$ws/Makefile ]; then \
				echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$ws...${NORM}"; \
				$(MAKE) -C $$ws test; \
				if [ $$? != 0 ]; then FAILURES="$$FAILURES $$ws"; fi; \
			fi; \
		fi; \
	done; \
	for src in ${TEST_JS}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
			(yarn --cwd=$$src run test); \
			if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
		fi; \
	done; \
	for src in ${TEST_MAKE}; do \
		if [ -z "${PKG}" -o "$$src" = "${PKG}" ]; then \
			echo "${BLUE}`date '+%Y-%m-%d %H:%M:%S%z'` Testing $$src...${NORM}"; \
			(${RSH} make -C $$src test); \
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
dist:	#: build the application image
	docker build --force-rm -t rexdb/${PRJ_NAME}:${PRJ_VER} .
.PHONY: dist


# Install the application.
dist-local:
	${MAKE} init-env install
.PHONY: dist-local


# Upload the distribution image.
upload:	#: upload the application image to a Docker registry (specify with REGISTRY=<URL>)
	@if [ -z "${REGISTRY}" ]; then echo "${RED}REGISTRY is not set!${NORM}"; false; fi
	docker tag rexdb/${PRJ_NAME}:${PRJ_VER} ${REGISTRY}/${PRJ_NAME}:${PRJ_VER}
	docker push ${REGISTRY}/${PRJ_NAME}:${PRJ_VER}
.PHONY: upload


# Start synchronizing files with the container.
sync: bin/sync sync-bin	#: start synchronizing files with the build container
	@./bin/sync
.PHONY: sync


start: ./bin/activate #: start application daemons using development configurations
	@./bin/honcho start ${SERVICE}
.PHONY: start


sync-once:
	${RSYNC} \
		--exclude /.hg/ \
		--exclude /.st/ \
		--exclude /.devmode \
		--exclude /.kubeconfig \
		--exclude '.*.sw?' \
		--exclude /bin/ \
		./ develop:/app/


sync-bin:
	@for exe in $$(${NOTERM_RSH} find bin '!' -type d -executable); do \
		[ -e $$exe ] || ln -s -f rsh $$exe; \
	done


bin/syncthing:
	set -e; \
	mkdir -p bin; \
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
	${RSH} make bin/syncthing; \
	${RSYNC} ./.st/remote/ develop:/app/.st/; \
	echo "$$SYNC_TEMPLATE" >./bin/sync; \
	chmod a+x ./bin/sync


# Configure the development environment.
configure:
	@set -e; \
	echo "${GREEN}Welcome to the ${PRJ_NAME} codebase!${NORM}"; \
	echo; \
	echo "We will now configure your development environment."; \
	devmode=; \
	while [ -z "$$devmode" ]; do \
		echo; \
		echo "Please choose the development mode:"; \
		echo "1) local mode (requires python3, node, and other development tools)"; \
		echo "2) docker mode (requires docker-compose)"; \
		echo "3) kubernetes mode (requires gcloud and kubectl)"; \
		read -p "> " n; \
		case $$n in \
			1) devmode=local;; \
			2) devmode=docker;; \
			3) devmode=kube;; \
			*) echo "${RED}Invalid choice!${NORM}";; \
		esac; \
	done; \
	${MAKE} configure-$$devmode
.PHONY: configure


configure-local:
	@command -v python3 >/dev/null 2>&1 && command -v node >/dev/null 2>&1 || (echo "${RED}Cannot find development tools!${NORM}" && false)
	@echo local > .devmode
.PHONY: configure-local


configure-docker:
	@command -v docker-compose >/dev/null 2>&1 || (echo "${RED}Cannot find docker-compose!${NORM}" && false)
	@echo docker > .devmode
.PHONY: configure-docker


configure-kube:
	@command -v kubectl >/dev/null 2>&1 || (echo "${RED}Cannot find kubectl!${NORM}" && false)
	${MAKE} .kubeconfig
	@echo kube > .devmode
.PHONY: configure-kube


.kubeconfig:
	@[ -e /var/run/secrets/kubernetes.io/serviceaccount ] || command -v gcloud >/dev/null 2>&1 || (echo "${RED}Cannot find gcloud!${NORM}" && false)
	@set -e; \
	[ -e /var/run/secrets/kubernetes.io/serviceaccount ] || exit 0; \
	echo; \
	echo "We need to prepare the Kubernetes context."; \
	echo; \
	echo "Already running in a Kubernetes cluster."; \
	namespace="${KUBE_NAMESPACE}"; \
	while [ -z "$$namespace" ]; do \
		default_namespace="$$(id -u -n)-$$(basename "${CURDIR}")"; \
		echo; \
		echo "Choose the namespace:"; \
		read -p "[$$default_namespace]> " n; \
		n="$${n:-$$default_namespace}"; \
		if echo "$$n" | grep -Eq '^[0-9a-zA-Z-]+$$'; then \
			namespace="$$n"; \
		else \
			echo "${RED}Invalid choice!${NORM}"; \
		fi; \
	done; \
	echo; \
	kubectl config set-context default --namespace="$$namespace"; \
	kubectl config use-context default; \
	echo; \
	echo "The following Kubernetes context has been prepared:"; \
	echo; \
	echo "Namespace: ${CYAN}$$namespace${NORM}"; \
	echo
	@set -e; \
	[ ! -e /var/run/secrets/kubernetes.io/serviceaccount ] || exit 0; \
	echo; \
	echo "We need to prepare the Kubernetes context."; \
	project="${KUBE_PROJECT}"; \
	while [ -z "$$project" ]; do \
		all_projects=$$(gcloud projects list --format="value(projectId)" 2>/dev/null); \
		default_project=$$(gcloud config get-value project 2>/dev/null); \
		echo; \
		echo "Choose the GCP project:"; \
		[ -n "$$all_projects" ] || echo "  (no projects found)"; \
		for p in $$all_projects; do echo "- $$p"; done; \
		read -p "[$$default_project]> " p; \
		p="$${p:-$$default_project}"; \
		if gcloud projects describe "$$p" >/dev/null 2>&1; then \
			project="$$p"; \
		else \
			echo "${RED}Invalid choice!${NORM}"; \
		fi; \
	done; \
	cluster="${KUBE_CLUSTER}"; \
	while [ -z "$$cluster" ]; do \
		all_clusters=$$(gcloud --project="$$project" container clusters list --format="value(name)" 2>/dev/null); \
		default_cluster=; \
		if [ $$(echo "$$all_clusters" | wc -w) = 1 ]; then default_cluster="$$all_clusters"; fi; \
		echo; \
		echo "Choose the GKE cluster:"; \
		[ -n "$$all_clusters" ] || echo "  (no clusters found)"; \
		for c in $$all_clusters; do echo "- $$c"; done; \
		read -p "[$$default_cluster]> " c; \
		c="$${c:-$$default_cluster}"; \
		if gcloud container clusters describe "$$c" >/dev/null 2>&1; then \
			cluster="$$c"; \
		else \
			echo "${RED}Invalid choice!${NORM}"; \
		fi; \
	done; \
	namespace="${KUBE_NAMESPACE}"; \
	while [ -z "$$namespace" ]; do \
		default_namespace="$$(id -u -n)-$$(basename "${CURDIR}")"; \
		echo; \
		echo "Choose the namespace:"; \
		read -p "[$$default_namespace]> " n; \
		n="$${n:-$$default_namespace}"; \
		if echo "$$n" | grep -Eq '^[0-9a-zA-Z-]+$$'; then \
			namespace="$$n"; \
		else \
			echo "${RED}Invalid choice!${NORM}"; \
		fi; \
	done; \
	echo; \
	gcloud --project="$$project" container clusters get-credentials "$$cluster"; \
	kubectl config set-context --current --namespace="$$namespace"; \
	echo; \
	echo "The following Kubernetes context has been prepared:"; \
	echo; \
	echo "GCP project: ${CYAN}$$project${NORM}"; \
	echo "GKE cluster: ${CYAN}$$cluster${NORM}"; \
	echo "Namespace: ${CYAN}$$namespace${NORM}"; \
	echo


.devmode:
	@${MAKE} configure


# GCP/Kubernetes configuration.
KUBE_PROJECT ?=
KUBE_CLUSTER ?=
KUBE_NAMESPACE ?=
KUBECONFIG = ${CURDIR}/.kubeconfig
export KUBECONFIG
NS = ${shell kubectl config view -o jsonpath="{.contexts[?(@.name==\"`kubectl config current-context`\")].context.namespace}"}


# Remote shell.
RSH = \
	${if ${filter docker,${DEVMODE}},docker-compose exec develop}${if ${filter kube,${DEVMODE}},kubectl exec -it develop -c develop --}
NOTERM_RSH = \
	${if ${filter docker,${DEVMODE}},docker-compose exec -T develop}${if ${filter kube,${DEVMODE}},kubectl exec develop -c develop --}
RSYNC_RSH = \
	${if ${filter docker,${DEVMODE}},docker-compose exec -T}${if ${filter kube,${DEVMODE}},/bin/sh -c 'exec kubectl exec \"\$$0\" -c develop -i -- \"\$$@\"'}
RSYNC = \
	rsync \
		--rsh "${RSYNC_RSH}" \
		--blocking-io --ignore-errors --links --recursive --times --compress


# Colors.
NORM = ${shell tput sgr0}
RED = ${shell tput setaf 1}
GREEN = ${shell tput setaf 2}
BLUE = ${shell tput setaf 4}
CYAN = ${shell tput setaf 6}
BOLD = ${shell tput bold}


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

	if ! [ -z "$${VIRTUAL_KUBE+_}" ] ; then
		unset VIRTUAL_KUBE
		if ! [ -z "$${_OLD_VIRTUAL_KUBECONFIG+_}" ] ; then
			KUBECONFIG="$$_OLD_VIRTUAL_KUBECONFIG"
			export KUBECONFIG
			unset _OLD_VIRTUAL_KUBECONFIG
		else
			unset KUBECONFIG
		fi
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

if [ -e "${KUBECONFIG}" ] ; then
	VIRTUAL_KUBE="${KUBECONFIG}"
	export VIRTUAL_KUBE
	_OLD_VIRTUAL_KUBECONFIG="$$KUBECONFIG"
	KUBECONFIG="${KUBECONFIG}"
	export KUBECONFIG
fi

if [ -n "$${BASH-}" ] || [ -n "$${ZSH_VERSION-}" ] ; then
	hash -r 2>/dev/null
fi
endef

define RSH_TEMPLATE
#!/bin/sh

set -e

if [ -e "${KUBECONFIG}" ]; then
	KUBECONFIG="${KUBECONFIG}"
	export KUBECONFIG
fi

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
	exec ${RSH} $$REMOTECMD
else
	set -x
	exec ${RSH} sh -ce "cd ./$$REMOTEDIR && exec $$REMOTECMD"
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
	${NOTERM_RSH} sh -c '[ -e /app/.st/'$$id'.pid ] && kill -0 `cat /app/.st/'$$id'.pid` > /dev/null 2>&1'
}

remote_start() {
	id=$$1
	shift
	${NOTERM_RSH} sh -c "$$*"' > /app/.st/'$$id'.log 2>&1 & echo $$! > /app/.st/'$$id'.pid && wait' &
}

remote_stop () {
	id=$$1
	if remote_status $$id; then
		${NOTERM_RSH} sh -c 'kill `cat /app/.st/'$$id'.pid`; rm /app/.st/'$$id'.pid'
	fi
}

if status syncthing; then
	echo Already synchronizing...
	exit 1
fi

set -e

if [ -e "${KUBECONFIG}" ]; then
	KUBECONFIG="${KUBECONFIG}"
	export KUBECONFIG
fi

trap "stop syncthing && stop port-forward && remote_stop syncthing && echo && exit 0" INT TERM EXIT

remote_start syncthing /app/bin/syncthing -home=/app/.st -no-browser -no-restart

if [ -e "${KUBECONFIG}" ]; then
	start port-forward kubectl port-forward develop :22000
	SYNC_PORT=
	while [ -z "$$SYNC_PORT" ]; do
		sleep 1
		SYNC_PORT=`sed -n -e 's/Forwarding from 127.0.0.1:\\(.*\\) -> 22000/\\1/p' ${CURDIR}/.st/port-forward.log`
	done
else
	. ${CURDIR}/.env
fi
sed -i.bak "s/<address>tcp:\\\\/\\\\/127.0.0.1:.*<\\\\/address>/<address>tcp:\\\\/\\\\/127.0.0.1:$$SYNC_PORT<\\\\/address>/" ${CURDIR}/.st/config.xml

start syncthing ${CURDIR}/bin/syncthing -home=${CURDIR}/.st -no-browser -no-restart

echo "${GREEN}Synchronizing (Ctrl-C to stop)...${NORM}"
wait
endef

export ACTIVATE_TEMPLATE RSH_TEMPLATE SYNCTHING_CONFIG_TEMPLATE SYNC_TEMPLATE

