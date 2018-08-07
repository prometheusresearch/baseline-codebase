***********************
Development Environment
***********************

The codebase workflows allow for two types of development environments: Docker
and "local". It is **highly advised** that you use the Docker-based development
workflow, as it makes setup of your environment much easier, and it will be
much closer to how the applications will be hosted in a Production environment
(thus reducing the "it works on my machine" issues).


Docker
======
When you use the recommended/default development workflow within a codebase
project, all of the build and execution steps occur within Docker containers,
so the tools that you need installed on your local machine are kept to a
minimum. Basically, you need Python, Mercurial, Docker, and Docker Compose.
After you've installed these tools (see instructions below for your operating
system), you'll bootstrap most codebase projects by running ``make init``.

MacOS
-----
1. Install `Homebrew <https://brew.sh/>`_. This boils down to two steps::

    $ xcode-select --install

   Follow the prompts to install the basic Xcode Command Line Tools. Once that
   is complete::

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

2. Install Python and Mercurial::

    $ brew install python@2 mercurial

3. Install `Docker Community Edition <https://www.docker.com/docker-mac>`_.

4. Install ``props.codebase``::

    $ pip install props.codebase -i https://dist.rexdb.us/simple

Ubuntu
------
1. Install the following packages to get Python, Mercurial, Docker, and Docker
   Compose (most of this comes from the ``universe`` repository).::

    $ sudo apt-get install python python-pip mercurial docker.io docker-compose

2. Make sure your user has access to the Docker service::

    $ sudo usermod -aG docker $USER

3. Install ``props.codebase``::

    $ sudo pip install props.codebase -i https://dist.rexdb.us/simple


Local
=====
Again, please use Docker. But, if you absolutely need to, and are comfortable
with more advanced environment setups, you can use the "local" workflow, which
requires that your local machine have all the build and execution tools
necessary. The exact tools you'll need may vary from codebase to codebase, but
at a minimum, you'll need things like:

* Python
* virtualenv
* NodeJS
* PostgreSQL (server, client, and libs/headers)
* sqlite
* OpenSSL
* Graphviz
* LaTeX (with extras & recommended)
* Git
* Mercurial

Once your local environment has all the necessary tools installed, you'll
bootstrap most codebase projects by running ``make init-local`` instead of
``make init``.

