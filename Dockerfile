ARG REXDB_TAG=2019.06.25

FROM rexdb/build:$REXDB_TAG AS build

WORKDIR /app

COPY Makefile* /app/
COPY pip.conf /app/
COPY src /app/src/
COPY js /app/js/

RUN make dist-local && \
    rm -f Makefile* pip.conf && \
    rm -rf src js


FROM rexdb/runtime:$REXDB_TAG

ARG APPLICATION_VERSION=DEVELOPMENT

WORKDIR /app

CMD ["/app/bin/rex"]

COPY --from=build app /app/

RUN echo "${APPLICATION_VERSION}" > /app/APPLICATION_VERSION

ENV PATH "/app/bin:${PATH}"

LABEL org.opencontainers.image.version=${APPLICATION_VERSION}

