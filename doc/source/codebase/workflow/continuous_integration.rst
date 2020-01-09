**********************
Continuous Integration
**********************

Prometheus Research uses an internal instance of `Concourse
<https://concourse-ci.org/>`_ as the tool to execute Continuous Integration
activities for our codebase workflow. It can be found at
https://concourse.rexdb.us


Adding Projects to Concourse
============================
For most projects, adding your project to Concourse can be done by using the
``add-project`` Makefile target in our configuration repository. This will
create a pipeline with the default behaviors (described below).

1. Clone the `prometheusresearch/concourse
   <https://github.com/prometheusresearch/concourse>`_ repository::

    $ git clone git@github.com:prometheusresearch/concourse.git

2. Create a branch for your changes::

    $ git checkout -b add-myproject

3. Execute the Makefile::

    $ make add-project PROJECT=myproject

4. Add, commit, and push the changes to GitHub. Send a pull request for your
   branch to the Engineering team.


Default Pipeline Jobs
=====================
The default pipeline includes two primary jobs. Failures during either of these
jobs, the author of the commits that triggered them will receive an email. If
your project needs something more, less, or different, then you'll need to
define your own pipeline (check with the Engineering team before going too far
down this path).

test
----
Every 5 minutes, Concourse will check your project's repository for new
commits. If it sees any, it will clone your repository, and execute the
configuration found in the ``concourse-test.yml`` file at the root of your
repository. In most situations, this is effectively the same as running ``make
init-local`` then ``make test``.

dist
----
Every 5 minutes, Concourse will check your project's repository for new tags.
If it sees any, it will clone your repository and build a Docker image using
the ``Dockerfile`` found in the root of your repository. The tag for that image
will be the same as the Git tag.

doc
---
Every 5 minutes, Concourse will check your project's repository for new
commits. If it sees any, it will clone your repository, and execute the
configuration found in the ``concourse-doc.yml`` file at the root of your
repository. In most situations, this is effectively the same as running ``make
init-local`` and then copying the contents of the ``/doc/build/html``
directory.

