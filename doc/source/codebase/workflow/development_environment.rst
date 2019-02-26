***********************
Development Environment
***********************

The default development workflows built into this project supports three modes:
Docker, Kubernetes, and Local. It is **highly advised** that you use the
Kubernetes- or Docker-based development workflows, as it makes setup of your
environment much easier, and it will be much closer to how the applications
will be hosted in a Production environment (thus reducing the "it works on my
machine" issues).

When you run ``make init`` from the base of a project's repository, you will be
prompted for the mode you want the initialization process to set your
environment up for. Before you go that far, read the following sections to know
what you'll need in order to succeed.


Kubernetes
==========
In "kube" mode, all the build and execution steps occur within Docker
containers that are hosted within a Kubernetes cluster. At a minimum, you'll
need:

* GNU make
* Kubernetes CLI
* Google Cloud SDK

MacOS
-----
1. If you haven't already, install `Homebrew <https://brew.sh/>`_. This boils
   down to two steps::

    $ xcode-select --install

   Follow the prompts to install the basic Xcode Command Line Tools. Once that
   is complete::

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

2. Install the Kubernetes CLI::

    $ brew install kubernetes-cli

   If you happen to already have Docker and its built-in, local Kubernetes
   system installed, you may also need to run the following to overwrite
   Docker's old version of the CLI::

    $ brew link --overwrite kubernetes-cli

3. Install the Google Cloud SDK. Download links and instructions can be found
   on `Google's website <https://cloud.google.com/sdk/docs/quickstart-macos>`_.


Ubuntu
------
1. Install the Kubernetes CLI. After `adding the Kubernetes apt repository
   <https://kubernetes.io/docs/tasks/tools/install-kubectl/>`_ to your
   configuration, you can do the following::

    $ sudo apt-get install make kubectl

2. Install the Google Cloud SDK. Instructions can be found on `Google's website
   <https://cloud.google.com/sdk/docs/quickstart-debian-ubuntu>`_.


Docker
======
In "docker" mode, all of the build and execution steps occur within Docker
containers and are coordinated with Docker Compose. At a minimum, you'll need:

* GNU make
* Docker
* Docker Compose

MacOS
-----
1. If you haven't already, install the Xcode Command Line Tools::

    $ xcode-select --install

2. Install `Docker Community Edition <https://www.docker.com/docker-mac>`_.

Ubuntu
------
1. Install the following packages::

    $ sudo apt-get install make docker.io docker-compose

2. Make sure your user has access to the Docker service::

    $ sudo usermod -aG docker $USER


Local
=====
Again, please use Kubernetes or Docker. But, if you absolutely need to, and are
comfortable with more advanced environment setups, you can use the "local"
workflow, which requires that your local machine have all the build and
execution tools necessary. The exact tools you'll need may vary from project to
project, but at a minimum, you'll need things like:

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

