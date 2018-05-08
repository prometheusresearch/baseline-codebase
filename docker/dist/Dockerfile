FROM rexdb/build:latest AS build

WORKDIR /app

CMD ["/bin/rex"]

COPY Makefile* /app/

COPY src /app/src/

RUN make dist-local && \
    rm -f Makefile* && \
    rm -rf src

FROM rexdb/runtime:latest

COPY --from=build app /app/

