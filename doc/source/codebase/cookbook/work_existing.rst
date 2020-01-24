***************************
Work on an Existing Project
***************************

The steps below outline the basic procedure for working on an **existing**
codebase project.

1. Clone the repository to your development system using ``git``::

      $ git clone git@github.com:prometheusresearch/myproject-codebase.git myproject
      $ cd myproject

2. When it finishes, your repository will be, checked out to the default branch
   of your project::

      $ git branch
        myproject/another-feature
      * myproject/master
        myproject/some-feature

   (The asterisk indicates which branch you're currently on)

3. Change to the appropriate branch and begin your work::

      $ git checkout myproject/some-feature

   Or start a new branch::

      $ git checkout -b myproject/some-new-thing

