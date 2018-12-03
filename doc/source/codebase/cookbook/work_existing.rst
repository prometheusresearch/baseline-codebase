***************************
Work on an Existing Project
***************************

The steps below outline the basic procedure for working on an **existing**
codebase project.

1. Clone the repository to your development system using ``props.codebase``.
   You can do so by just specifying the name of your project (without the
   ``-codebase``)::

      $ props.codebase install myproject

2. When it finishes, your repository will be a directory named for your
   project, checked out to the default branch of your project::

      $ cd myproject
      $ hg id
      eb61347dbce9 (myproject/default) tip

3. Create or change to the appropriate branch and begin your work::

      $ hg branch myproject/some-feature

