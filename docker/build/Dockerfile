FROM rexdb/runtime:latest

RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb http://deb.nodesource.com/node_6.x xenial main' >/etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y \
        build-essential \
        inotify-tools \
        latexmk \
        libssl-dev \
        nodejs \
        texlive-latex-extra \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        python-dev \
        python-virtualenv \
        vim-nox && \
    rm -rf /var/lib/apt/lists/*

