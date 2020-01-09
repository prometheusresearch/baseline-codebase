******************************
Updating a Codebase Dependency
******************************

The steps below outline the basic procedure for updating the version of the
base codebase project that you've built your project upon.

1. Using ``git``, retrieve all the latest code from your upstream template
   project. In this example, our project is based on RexStudy::

      $ git remote add study git@github.com:prometheusresearch/study-codebase.git
      $ git fetch study

2. Next, merge in the upstream changes from whichever branch or tag you
   desire::

      $ git merge study/study/master

3. At this time, if you've made any local modifications to the files you
   inherited from the base project, ``git`` may prompt you to resolve merge
   conflicts. Reach out to the Engineering team if you need help figuring out
   how to merge your local changes with those from the updated base project.

4. After you've resolved any merge conflicts that arose, test your application
   and resolve any issues that may have been introduced by the upgrade.

