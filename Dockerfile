FROM rexdb/build:2018.06.29 AS build

WORKDIR /app

COPY Makefile* /app/

COPY src /app/src/

RUN make dist-local && \
    rm -f Makefile* && \
    rm -rf src

FROM rexdb/runtime:2018.06.29

WORKDIR /app

CMD ["/app/bin/rex"]

COPY --from=build app /app/

