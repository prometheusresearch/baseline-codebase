*******************
Start a New Project
*******************

The steps below outline the basic procedure for starting a **brand new**
codebase project.

1. Create an empty private repository in GitHub. The name of this repository
   should follow the convention ``<PROJECT NAME>-codebase``. For this example,
   we'll use ``myproject-codebase``.

2. At a terminal, use ``git`` to create the repository and connect it to
   GitHub::

      $ git init myproject
      $ cd myproject
      $ git remote add origin git@github.com:prometheusresearch/myproject-codebase.git

3. Next, you need to pull in the upstream template repository that you want to
   base your project one. For this example, we'll pretend our project is based
   on RexStudy::

      $ git remote add study git@github.com:prometheusresearch/study-codebase.git
      $ git fetch study

4. Finally, you then need to create you project's master branch based off of
   your desired version of the upstream template. All branches that you create
   in your repository, including master, must be prefixed with your project
   name (e.g., ``myproject/master``)::

      $ git checkout --no-track -b myproject/master study/study/master
      $ git push origin myproject/master

   In this example, we started our project from the absolute most recent
   version of RexStudy, which is located on the study/master branch. If you
   instead wanted to base your project off of a tag or specific commit, you
   can use that name or hash in place of the ``study/study/master`` above.

Notes:

* When starting a new project, you should check out two bits of documentation
  provided by the base project you built yours from:

  * The official project documentation, which you'll find on ``doc.rexdb.us``
    (e.g. https://doc.rexdb.us/study/). This will have the full documentation
    of the project, including any API reference materials, usage instructions,
    etc.

  * The README for the project at the root of the repository (e.g.
    ``README.study.rst``). This will have quick-start instructions intended to
    get you moving in terms of booting up the application, etc.

* In GitHub, for convenience's sake, you should set the "Default branch" of
  your repository to be the master branch of your project (e.g.,
  ``myproject/master``). You'll find this option in the "Branches" section of
  the GitHub project Settings section.

