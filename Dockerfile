FROM rexdb/build:2018.07.26 AS build

WORKDIR /app

COPY Makefile* /app/

COPY src /app/src/

RUN make dist-local && \
    rm -f Makefile* && \
    rm -rf src

FROM rexdb/runtime:2018.07.26

WORKDIR /app

CMD ["/app/bin/rex"]

COPY --from=build app /app/

