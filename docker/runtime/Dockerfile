FROM ubuntu:16.04

RUN apt-get update && \
    apt-get install -y \
        curl \
        python \
        python-crypto \
        python-cryptography \
        python-openssl \
        python-psycopg2 \
        python-yaml \
        rsync \
        uwsgi \
        uwsgi-plugin-python && \
    rm -rf /var/lib/apt/lists/*

