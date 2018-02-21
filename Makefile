# Environment references
ROOT := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
PBBT := $(ROOT)/bin/pbbt
NPM := $(ROOT)/bin/npm

# Default values
TESTS_PBBT =
TESTS_NPM =

# Local overrides/additions
include Makefile.local


## Bootstrapping

bootstrap::
	@$(ROOT)/bootstrap

bootstrap-local::
	@$(ROOT)/bootstrap --local


## Testing

test-pbbt-module = cd $(ROOT)/src/$(module) && $(PBBT) &&

test-pbbt::
	@$(foreach module, $(TESTS_PBBT), $(test-pbbt-module)) true

test-npm-module = cd $(ROOT)/src/$(module) && $(NPM) test &&

test-npm::
	@$(foreach module, $(TESTS_NPM), $(test-npm-module)) true

test:: test-pbbt test-npm

