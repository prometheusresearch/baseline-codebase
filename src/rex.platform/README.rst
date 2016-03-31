************************
REX.PLATFORM Usage Guide
************************

.. contents:: Table of Contents
   :depth: 3


Overview
========

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


System Requirements
===================

The RexDB platform suite builds its functionality atop a number of open source
libraries and application. While most of these dependencies can be installed
via standard Python tools, some of them must be installed via means that are
specific to the environment's operating system. In this section we'll
describes, at a high level, the dependencies that you'll need to execute or
develop with the RexDB platform, as well as how to install them on common
development platforms.


Requirements
------------

The RexDB plaform suite (and/or its direct dependencies) depend on the
following software in its runtime environment:

* Python 2.7
* PostgreSQL 9+
* OpenSSL
* libjpeg
* zlib
* libtiff
* libfreetype
* littlecms
* libwebp

If you plan on building applications with the RexDB platform that require use
of its JavaScript or documentation bundling functionality, then the following
will also be required:

* Mercurial
* Git
* NodeJS
* LaTeX


System Instructions
-------------------

Ubuntu (Trusty 14.04)
~~~~~~~~~~~~~~~~~~~~~

To install most of the necessary dependencies to use RexDB on a Trusty
installation, use ``apt-get`` to install the following packages:

* python-dev
* libffi-dev
* libssl-dev
* libyaml-dev
* libjpeg-dev
* libtiff5-dev
* libfreetype6-dev
* libwebp-dev
* libpq-dev
* postgresql
* mercurial
* git
* nodejs
* npm
* texlive
* xzdec

To build PDF documentation, you need to install LaTeX and additional TeX
libraries:

* texlive-latex-recommended
* texlive-latex-extra
* texlive-fonts-recommended

If you've previously installed ``pip`` and/or ``virtualenv`` using the system
packages (``python-pip``, ``python-virtualenv``), it's **highly** recommended
that you uninstall them and instead install the newest ``pip`` directly from
the `PyPA`_. The old version of ``pip`` that is in the Ubuntu repositories is
very far behind in terms of functionality and bug fixes. You will more than
likely run into problems trying to install RexDB without a more recent version
of ``pip``::

    $ wget https://bootstrap.pypa.io/get-pip.py -O - | sudo /usr/bin/python -
    $ sudo pip install pyasn1 ndg-httpsclient virtualenv

.. _`PyPA`: https://www.pypa.io


Mac OSX
~~~~~~~

The easiest way to install most of the dependencies and tools you'll need for
RexDB in OSX is to use the `Homebrew`_ tool. If you don't already have it
installed, go to the `Homebrew`_ home page and follow the instructions for
installation. (Note that Homebrew will require Xcode, which you can get for
free from the Mac App Store)

.. _`Homebrew`: http://brew.sh/

With Homebrew (e.g., ``brew install <package>``), install the following
packages:

* openssl
* libtiff
* libjpeg
* webp
* freetype
* python
* postgresql
* graphviz
* mercurial
* git
* node

Aftwards, use ``pip`` to install ``virtualenv``::

    $ sudo pip install virtualenv

To install LaTeX, go to the `MacTeX site`_ and download and install the
``BasicTex.pkg`` file.

.. _`MacTeX site`: https://tug.org/mactex/morepackages.html

Once MacTeX is installed, execute the following command to install a series of
additional TeX libraries that support features that are commonly used in RexDB
handbooks and documentation::

    $ sudo tlmgr install titlesec framed threeparttable wrapfig multirow courier helvetic capt-of needspace eqparbox environ trimspaces upquote

