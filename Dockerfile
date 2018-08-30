ARG REXDB_TAG=2018.08.30

FROM rexdb/build:$REXDB_TAG AS build

WORKDIR /app

COPY Makefile* /app/

COPY src /app/src/

RUN make dist-local && \
    rm -f Makefile* && \
    rm -rf src

FROM rexdb/runtime:$REXDB_TAG

WORKDIR /app

CMD ["/app/bin/rex"]

COPY --from=build app /app/

