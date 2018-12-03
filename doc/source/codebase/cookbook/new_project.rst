*******************
Start a New Project
*******************

The steps below outline the basic procedure for starting a **brand new**
codebase project.

1. Create an empty Mercurial repository in Bitbucket. The name of this
   repository should follow the convention ``<PROJECT NAME>-codebase``. For
   this example, we'll use ``myproject-codebase``.

2. At a terminal, use ``props.codebase`` to initialize the new repository. When
   you do so, you'll want to choose what other codebase repository you want to
   establish as the dependency and what version of it to base your project
   upon. For this example, we'll pretend our project is based on RexStudy::

      $ props.codebase init myproject -r study/4.24.0

3. After the project has been initialized (it may take a while), you can then
   clone it to your development system to begin work::

      $ props.codebase install myproject


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

* In Bitbucket, for convenience's sake, you should set the "Main branch" of
  your repository to be the default branch of your project (e.g.,
  ``myproject/default``). You'll find this option in the "Repository details"
  section of the Bitbucket project admin section.

