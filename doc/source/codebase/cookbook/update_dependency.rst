******************************
Updating a Codebase Dependency
******************************

The steps below outline the basic procedure for updating the version of the
base codebase project that you've built your project upon.

1. Using Mercurial, retrieve all the latest code from your base project. In
   this example, our project is based on RexStudy::

      $ hg pull ssh://hg@bitbucket.org/prometheus/study-codebase

2. Using Mercurial, merge in the desired version of the base project into your
   project::

      $ hg id
      eb61347dbce9 (myproject/default) tip
      $ hg merge study/5.1.2

3. At this time, if you've made any local modifications to the files you
   inherited from the base project, Mercurial may prompt you to resolve merge
   conflicts. Reach out to the Engineering team if you need help figuring out
   how to merge your local changes with those from the updated base project.

4. After you've resolved any merge conflicts that arose, commit the changes::

      $ hg commit -m "Updated to study/5.1.2"

5. Test your application and resolve any issues that may have been introduced
   by the upgrade.

