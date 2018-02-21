FROM rexdb/build:latest

VOLUME /repo
VOLUME /app
WORKDIR /app

CMD ["/sync.sh"]

RUN apt-get update && \
    apt-get install -y \
        lsyncd && \
    rm -rf /var/lib/apt/lists/*

COPY sync.sh sync.lua /

