**************************
  REX.URLMAP Usage Guide
**************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package allows you to map HTTP requests to HTML templates.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting started
===============

:mod:`rex.urlmap` allows you to configure *URL mapping* for your RexDB
application.  With :mod:`rex.urlmap`, you can declare a set of URL handled by
your application and associate with each URL a respective HTML template.

To use this package, add :mod:`rex.urlmap` to the list of dependencies of your
application.

For a web application, a clean and consistent URL scheme is important for
improving user experience.  Suppose you are developing a web application for
managing medical research projects.  The application may contain the following
pages:

* *Welcome screen.*  This page may contain some basic statistics and provide
  links to other parts of the application.

* *List of research studies.*  This page contains a list of studies with
  links to individual study pages.

* *Study details.*  On this page, a user can see some information about the
  selected study.

For this application, you may design the following URL mapping scheme:

``/``
    The welcome screen.

``/studies``
    The page with the list of studies.

``/studies/$id``
    Study details page.

The last URL is particularly interesting because it is parameterized by the
study identifier.  That is, it describes not just one URL, but a family of
URLs.  URL ``/studies/fos`` may lead to *Family Obesity Study* page while URL
``/studies/asdl`` opens *Autism Spectrum Disorder Lab* page.

Now having designed the URL mapping scheme, you can declare it using
:mod:`rex.urlmap`.  Create a static resource ``urlmap.yaml`` with the following
lines::

    context:

      navigation:
      - path: /
        title: Home
      - path: /studies
        title: Studies

    paths:

      /:
        template: /template/index.html
        access: anybody

      /studies:
        template: /template/list.html
        context:
          query: /study{code, title}

      /studies/$study_id
        template: /template/detail.html
        context:
          query: study[$id]{code, title}

We will review this file line by line.  The ``urlmap.yaml`` file contains
two sections: ``context`` and ``paths``.  The latter is a mapping that
defines URL handlers.  The ``context`` section contains global attributes
that are passed to every template.  In our example, ``context`` contains
a list of links with titles for the navigation bar.

The ``paths`` sections defines three URLs: ``/``, ``/studies`` and
``/studies/$study_id``.

The URL ``/`` is mapped onto HTML template ``/template/index.html``.
Attribute ``access: anybody`` indicates that the index page is accessable
by unauthenticated users.  By default, only authenticated users are
permitted.

The URL ``/studies`` is mapped to HTML template ``/template/list.html``.
The ``context`` field defines additional parameters to be passed to the
template.  In this case, we pass ``query`` parameter which contains an
HTSQL query used to render the list of studies.

Finally, the family of URLs ``/studies/$study_id`` is mapped to
template ``/template/detail.html``.  Again, we pass an additional context
parameter ``query`` to the template, which is used to render a specific
study.


