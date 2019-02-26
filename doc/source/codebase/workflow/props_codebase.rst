**************
props.codebase
**************

We've put together a simple tool to help make working with Codebase
repositories a little easier. It's entirely optional, as everything it does can
be done by hand using standard Mercurial commands, but we advise its use as it
can help speed things up and keep you out of (some forms of) trouble.


Installation
============

All Prometheus development servers that support the Codebase workflows will
already have ``props.codebase`` installed for your use. If you're working
locally on your laptop, you'll need to have Python and Mercurial installed so
that you can use ``props.codebase``:

MacOS
-----
1. Install `Homebrew <https://brew.sh/>`_. This boils down to two steps::

    $ xcode-select --install

   Follow the prompts to install the basic Xcode Command Line Tools. Once that
   is complete::

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

2. Install Python and Mercurial::

    $ brew install python@2 mercurial

3. Install ``props.codebase``::

    $ pip install props.codebase -i https://dist.rexdb.us/simple

Ubuntu
------
1. Install the following packages::

    $ sudo apt-get install python python-pip mercurial

2. Install ``props.codebase``::

    $ sudo pip install props.codebase -i https://dist.rexdb.us/simple


Usage
=====

The most common usage of ``props.codebase`` is to clone a repository from
Bitbucket so that you can work on it. To do so, execute::

   $ props.codebase install <project>

Where ``<project>`` is the name of your repository, without the ``-codebase``
suffix. This will clone the repository down to the current directory, install a
small Mercurial extension, and update your working directory to the
``<project>/default`` branch.

