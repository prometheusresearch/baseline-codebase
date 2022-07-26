# syntax = docker/dockerfile:experimental

ARG REXDB_TAG=2022.07.26

FROM rexdb/build:$REXDB_TAG AS build

WORKDIR /app

COPY Makefile* /app/
COPY pip.conf /app/
COPY src /app/src/
COPY js /app/js/

RUN --mount=type=cache,target=/cache \
    CI=true \
    CONTINUOUS_INTEGRATION=true \
    npm_config_cache=../cache/npm \
    YARN_CACHE_FOLDER=../cache/yarn \
    PIP_CACHE_DIR=../cache/pip \
    make dist-local && \
    rm -f Makefile* pip.conf && \
    rm -rf src js

FROM rexdb/runtime:$REXDB_TAG

WORKDIR /app

CMD ["/app/bin/rex"]

COPY --from=build app /app/

RUN /app/bin/rex

ENV PATH "/app/bin:${PATH}"

