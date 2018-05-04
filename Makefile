.PHONY: \
	default \
	init init-local init-cfg init-docker init-sync init-remote init-bin init-env init-dev \
	up down \
	build install \
	test \
	dist dist-local \
	clean

include Makefile.local
include Makefile.template

PRJ_NAME = ${shell hg identify -b | cut -d / -f 1}
PRJ_VER = ${firstword ${shell hg identify -t | cut -d / -f 2 -s} ${shell hg identify -i | tr -d +}}

default:
	@echo "Available targets:"
	@echo "make init           initialize the development environment in a docker container"
	@echo "make init-local     initialize the development environment locally"
	@echo "make up             start docker containers"
	@echo "make down           stop docker containers"
	@echo "make build          recompile source packages"
	@echo "make test           test source packages"
	@echo "make dist           build the docker image for distribution"
	@echo "make clean          remove installed docker containers and volumes"

# Initialize the development environment in a docker container.
init:
	@if [ -e bin/activate ]; then echo "the development environment is already initialized"; false; fi
	${MAKE} init-cfg init-docker up init-sync init-remote init-bin

# Initialize the development environment locally.
init-local:
	@if [ -e bin/activate ]; then echo "the development environment is already initialized"; false; fi
	${MAKE} init-cfg init-env init-dev build

# Enable default configuration.
init-cfg:
	for src in default/.* default/*; do \
		if [ ! -f $$src ]; then continue; fi; \
		cp -a $$src $$(basename $$src); \
	done
	mkdir -p ./data/attach
	mkdir -p ./run
	ln -sf ./run/socket ./socket

# Prepare and start containers.
init-docker:
	docker build -q -t rexdb/runtime ./docker/runtime
	docker build -q -t rexdb/build ./docker/build
	docker build -q -t rexdb/develop ./docker/develop

# Synchronize the source tree.
init-sync:
	docker-compose exec develop \
		rsync --delete --exclude /.hg/ --exclude /bin/ --exclude /data/ --exclude /run/ \
		--ignore-errors --links --recursive --times \
		/repo/ /app/

# Initialize the environment in the container.
init-remote:
	docker-compose exec develop make init-local

# Populate the local ./bin/ directory.
init-bin:
	mkdir -p bin
	echo "$$ACTIVATE_TEMPLATE" >./bin/activate
	echo "$$COMPOSE_TEMPLATE" >./bin/docker-compose
	chmod a+x ./bin/docker-compose
	echo "$$RSH_TEMPLATE" >./bin/rsh
	chmod a+x ./bin/rsh
	for exe in $$(docker-compose exec develop find bin '!' -type d -executable | tr -d '\r'); do \
		ln -s rsh $$exe; \
	done

# Initialize Python virtual environment.
init-env:
	virtualenv --system-site-packages .

# Install development tools.
init-dev:
	./bin/pip install -q pbbt==0.1.5
	./bin/pip install -q coverage==4.5.1
	./bin/pip install -q pytest==3.5.0
	echo "$$PBBT_TEMPLATE" >./bin/pbbt
	chmod a+x ./bin/pbbt

# Start Docker containers.
up:
	docker-compose up -d

# Stop Docker containers.
down:
	docker-compose down

# Check that the development environment is initialized.
./bin/activate:
	@echo "run \"make init\" or \"make init-local\" to initialize the development environment"; false

# Compile source packages.
build: ./bin/activate
	set -ex; \
	for src in ${SRC_PY}; do \
		./bin/pip install -e $$src; \
	done

# Compile and install source packages.
install: ./bin/activate
	set -ex; \
	for src in ${SRC_PY}; do \
		./bin/pip install $$src; \
	done

# Test source packages.
test: ./bin/activate
	FAILURES=; \
	for src in ${SRC_PY}; do \
		if [ -e $$src/test/input.yaml ]; then \
			echo "Testing $$src..."; \
			(cd $$src; ${CURDIR}/bin/pbbt -q -M 0); \
			if [ $$? != 0 ]; then FAILURES="$$FAILURES $$src"; fi; \
		fi; \
	done; \
	if [ -n "$$FAILURES" ]; then echo "Testing failed:" $$FAILURES; false; fi

# Build the docker image for distribution.
dist:
	${MAKE} init-docker
	docker build -t rexdb/${PRJ_NAME}:${PRJ_VER} -f ./docker/dist/Dockerfile .

# Install the application.
dist-local:
	${MAKE} init-env install

# Remove docker containers and volumes.
clean:
	docker-compose down -v --remove-orphans

