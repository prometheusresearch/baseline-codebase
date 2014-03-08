**************************
  REX.URLMAP Usage Guide
**************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package lets you map incoming URLs to URL handlers such as:

* HTML templates;
* HTSQL queries *(TODO)*;
* Javascript and CSS bundles *(TODO)*.

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
application.  You can specify a set of URLs accepted by the application and
associate each URL with a URL handler such as an HTML template or an HTSQL
query.

For a web application, a clean and consistent URL scheme is important for
improving the user experience.  In this guide, let's assume we are developing a
web application for managing medical research projects.  The application
consists of the following pages:

* *Welcome screen.*  This page may contain some basic statistics and provide
  links to other parts of the application.

* *List of research studies.*  This page contains a list of studies with links
  to specific study pages.

* *Study details.*  On this page, a user can see some information about the
  selected study.

* *List of indiviuals.*  This page contains a list of human research subjects.

* *Individual details*.  This page describes a selected research subject.

We also noticed that the pages *List of research studies* and *List of
individuals*, as well as *Study details* and *Indivual details* are similar
enough so they could be generated from the same HTML template.  Finally, all
the pages share a common navigation bar.

For this application, we designed the following URL mapping scheme:

``/``
    *Welcome screen*
``/study``
    *List of research studies*
``/study/$id``
    *Study details*
``/individual``
    *List of individuals*
``/individual/$id``
    *Individual details*

Here, URLs ``/study/$id`` and ``/individual/$id`` are parameterized by the
``$id`` label and describe whole families of URLs.  For example, ``/study/fos``
may show details of a *Family Obesity Study* while ``/individual/1001``
displays information about an individual with code ``1001``.

Now let's encode this URL scheme with :mod:`rex.urlmap`.  First, we need to
add :mod:`rex.urlmap` to the list of dependencies of the application.  Next,
we create a static resource ``urlmap.yaml``.  It contains two sections::

    context:
      ...

    paths:
      ...

Section ``context`` contains context variables that are passed to all HTML
templates declared in ``urlmap.yaml``.  In our case, we use this section to
configure the navigation bar::

    context:

      navigation:
      - path: /
        title: Home
      - path: /study
        title: Studies
      - path: /individual
        title: Individuals

With this definition, we can use variable ``navigation`` in HTML templates as
follows::

    <ul class="nav navbar-nav">
    {%- for entry in navigation %}
      <li><a href="{{ MOUNT['rex.urlmap_demo'] }}{{ entry.path }}">{{ entry.title|e }}</a></li>
    {%- endfor %}
    </ul>

Section ``paths`` configures URL mapping::

    paths:

      /:
        ...

      /study:
        ...

      /study/$id:
        ...

      /individual:
        ...

      /individual/$id:
        ...

For each URL in this list, we must specify an HTML template used to render the
page.  For example::

    /:
      template: /template/index.html
      access: anybody

Field ``template`` is the path to the HTML template.  Field ``access`` restricts
access to the page.  Value *anybody* means that this page could be accessed by
unauthenticated users.

We can pass extra context variables to the templates.  For example::

    /study:
      template: /template/list.html
      context:
        title: Studies
        query: /study{code, title}

    /study/$id:
      template: /template/detail.html
      context:
        title: Study
        query: study[$id]{code, title}

Here, we pass context variables ``title`` and ``query`` to a generic template,
which uses them to render a customizable section of the page.  For example,
template ``/template/list.html`` uses variable ``query`` to generate a table
with a list of links::

    <table class="table table-striped">
    {% for record in htsql(query) %}
      <tr><td><a href="{{ PATH }}/{{ record.code|ue }}">{{ record.title|e }}</a></td></tr>
    {% endfor %}
    </table>

This technique allows us to adapt the same template to different pages.  For
example, we can use templates ``list.html`` and ``detail.html`` to generate
*Individual* pages::

    /individual:
      template: /template/list.html
      context:
        title: Individuals
        query: /individual{code, first_name+' '+last_name :as title}

    /individual/$id:
      template: /template/detail.html
      context:
        title: Individual
        query: individual[$id]{code, first_name+' '+last_name :as title}


Include and override
====================

When the ``urlmap.yaml`` file becomes too large, it is convenient to split it
into several smaller files.  You can do this with an ``include`` field.

In our sample application, let's move *Study* and *Individual* pages to
separate configuration files.  Create file ``./static/urlmap/study.yaml``::

    paths:

      /study:
        template: /template/list.html
        ...

      /study/$id:
        template: /template/detail.html
        ...

and file ``./static/urlmap/individual.yaml``::

    paths:

      /individual:
        template: /template/list.html
        ...

      /individual/$id:
        template: /template/detail.html
        ...

After extracting *Study* and *Individual* pages from ``urlmap.yaml``, it will
have the form::

    include:
    - /urlmap/study.yaml
    - /urlmap/individual.yaml

    context:
      ...

    paths:

      /:
        template: /template/index.html
        ...

Note that we added a new section ``include`` with a list of files containing
additional configuration.

Sometimes, when we include an existing configuration file, we may want to
modify some URL mapping definition.  We can do this with an ``!override`` tag.

Suppose we want to change the title of the ``/individual`` page from
*Individuals* to *Human research subjects* without modifying the file
``/urlmap/individual.yaml``, where the page is defined.  In ``/urlmap.yaml``,
we add a definition::

    include:
    - /urlmap/study.yaml
    - /urlmap/individual.yaml

    paths:

      ...

      /individual: !override
        context:
          title: Human research subjects

Remember the page definition in ``/urlmap/individual.yaml``::

    /individual:
      template: /template/list.html
      context:
        title: Individuals
        query: /individual{code, first_name+' '+last_name :as title}

When it is combined with the ``!override`` definition in ``urlmap.yaml``, we
get::

    /individual:
      template: /template/list.html
      context:
        title: Human research subjects
        query: /individual{code, first_name+' '+last_name :as title}


The ``urlmap.yaml`` file format
===============================

In this section, we describe the format of the ``urlmap.yaml`` configuration
file.  This file may contain the following fields:

`include`
    File or a list of files to include.  Relative and absolute file paths are
    accepted.  The files must be in the ``urlmap.yaml`` format; it particular,
    they may also contain an `include` section.

    Examples::

        include:
        - /urlmap/study.yaml
        - /urlmap/individual.yaml

        include: rex.study:/urlmap.yaml

    In the first example, URL mapping configuration is loaded from files
    ``./static/urlmap/study.yaml`` and ``./static/urlmap/individual.yaml`` from
    the same package.

    In the second example, additional configuration is loaded from file
    ``./static/urlmap.yaml`` from package ``rex.study``.

`context`
    Variables to pass to all templates defined in this file.

    Example::

        context:

          navigation:
          - path: /
            title: Home
          - path: /study
            title: Studies
          - path: /individual
            title: Individuals

    In this example, we define a single context variable ``navigation`` with a
    list of links for the navigation bar.

`paths`
    Maps URLs to URL handlers.

    Example::

        paths:

          /study:
            template: /template/list.html
            context:
              title: Studies
              query: /study{code, title}

          /study/$id:
            template: /template/detail.html
            context:
              title: Study
              query: study[$id]{code, title}

    A URL may contain a *labeled segment*, in the form ``$<name>``.  For
    example::

        /individual/$id

    This URL expression matches any 2-segment URL which starts with
    ``/individual/``.  For example, it matches URL::

        /individual/1001

    For this URL, variable ``id`` equal to ``1001`` will be added to the
    template context.

    Labeled segments must be percent-encoded.

    URL handlers of different types are described in the following sections.


Template handler
================

A template handler renders an HTML page from a template ``template`` using
context variables ``context``.  The following fields are expected:

`template`
    Path to a Jinja template.  To use a template from a different package, add
    the package name and ``:`` to the path.

    Examples::

        template: /template/list.html

        template: rex.acquire:/template/index.html

    This field is mandatory.

`context`
    Variables to pass to the template.  Variables defined here override
    variables defined in the top-level ``context`` section.

    Example::

        context:
          title: Studies
          query: /study{code, title}

`access`
    Permission required to access the URL.  If not set, the permission of the
    package that owns the handler is assumed.

    Example::

        access: anybody

`unsafe`
    Enables CSRF protection for this page.  If enabled, the incoming request
    must contain a CSRF token.  By default, CSRF protection is disabled.

    Example::

        unsafe: true

`parameters` *(TODO: validation?)*
    Maps expected query parameters to default values.

    Query parameters are passed to the template as context variables.
    Unexpected query parameters are rejected.

    Example::

        parameters:
          search: ''


Override handler
================

An override handler allows you to redefine some fields of an existing handler.
Thus you can only use an override handler for paths with an existing handler
defined in another configuration file.

An override handler is marked by a YAML tag ``!override``.  It may contain all
the fields of a template handler:

    ``template``, ``context``, ``access``, ``unsafe``, ``parameters``.

None of the fields is mandatory.  Fields that are omitted are inherited from
the original template handler.

Example::

    !override
    context:
      title: Human research subjects

The complete file with this override definition may look like this::

    include:
    - /urlmap/study.yaml
    - /urlmap/individual.yaml

    paths:

      /individual: !override
        context:
          title: Human research subjects

The original handler for ``/individual`` is defined in
``/urlmap/individual.yaml``::

    paths:

      /individual:
        template: /template/list.html
        context:
          title: Individuals
          query: /individual{code, first_name+' '+last_name :as title}

      ...

The ``!override`` definition changes the ``title`` context variable
to a new value.  All the other context variables and other parameters
are unchanged.


