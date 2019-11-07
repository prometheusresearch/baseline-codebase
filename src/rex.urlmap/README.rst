**************************
  REX.URLMAP Usage Guide
**************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package lets you map incoming URLs to URL handlers such as:

* HTML templates;
* HTSQL queries;
* database ports.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting started
===============

:mod:`rex.urlmap` allows you to configure *URL mapping* for your RexDB
application.  You can specify a set of URLs accepted by the application and
associate each URL with a URL handler such as an HTML template or a database
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


Database access
===============

We could also use :mod:`rex.urlmap` to provide access to the application
database.  A URL that shows a slice of the database is called a *port*.  For
our demo application, we would like to define the following 3 ports:

* *Study port*.  It provides access to the ``study`` table.
* *Individual port*.  Provides access to the ``individual`` table.
* *Totals port*.  Provides the total number of ``study`` and ``individual``
  records.

We attach these ports to the following URLs:

``/data/study``
    *Study port*
``/data/individual``
    *Individual port*
``/data/total``
    *Totals port*

To do this, we add the following lines to the ``paths`` section of
``urlmap.yaml``::

    paths:
      ...

      /data/study:
        port: study?!closed

      /data/individual:
        port: individual

      /data/total:
        port:
        - total_study := count(study?!closed)
        - total_individual := count(individual)
        access: anybody
        read-only: true

We use field ``port`` to describe the subset of data provided through the port.
The URL ``/data/study`` provides all records from ``study`` table that satisfy
condition ``!closed``.  The URL ``/data/individual`` produces all records from
``individual`` table.  Finally, ``/data/total`` generates the total number of
records in ``study`` and ``individual`` ports.  For a complete reference on the
port definition syntax, see documentation to :mod:`rex.port`.

In the last definition, we used field ``access`` to override the default access
permissions to the port.  Value *anybody* means that the port could be accessed
by unauthenticated users.  This port is also marked *read-only*, which means it
cannot be used for CRUD operations.

While ports provide a convenient and comprehensive way to access database, you
can also use :mod:`rex.urlmap` to map URLs to raw HTSQL queries.  For example,
URL ``/data/total`` could be defined as an HTSQL query::

    /data/total:
      query: |
        {
          total_study := count(study?!closed),
          total_individual := count(individual),
        }
      access: anybody


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

Sometimes you may need to render the same page under more than one URL.  To
enable it without copying the complete configuration, use ``!copy`` directive.
For example, to make ``/individuals`` URL a clone of ``/individual``, add::

    /individuals: !copy /individual


Embedding settings values
=========================

You can use a value of an application setting in ``urlmap.yaml``.  Let's assume
that the application declares a setting called ``site_title``::

    from rex.core import Setting, StrVal

    class SiteTitleSetting(Setting):
        """
        The title of the site displayed on the root page.
        """
        name = 'site_title'
        validate = StrVal()
        default = "A Rex application'

You can set the value of this setting in a ``setting.yaml`` file or pass it as
a command-line parameter when you start the application.

Use ``!setting`` tag to include the value of the setting in ``urlmap.yaml``.
For example::

    /:
      template: /template/index.html
      access: anybody
      context:
        title: !setting site_title


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

          /data/study:
            port: study?!closed

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


Query handler
=============

A query handler executes a prepared HTSQL query with the given parameters.  The
following fields are expected:

`query`
    HTSQL query to execute.

    Example::

        query: /individual{id()}?sex=$sex

    This field is mandatory.

`gateway`
    The name of a gateway database.  If not set, the query is executed against
    the main application database.

    Example::

        gateway: input

`access`
    Permission required to execute the query.  If not set, the permission of
    the package that owns the handler is assumed.

    Example::

        access: anybody

`unsafe`
    Enables CSRF protection for the query.  If enabled, the incoming request
    must contain a CSRF token.  By default, CSRF protection is disabled.

    Example::

        unsafe: true


Port handler
============

A port handler provides access to the application database.  The following
fields are expected:

`port`
    The port definition, which includes a list of tables, columns and
    calculated fields available through the port.  For a complete reference on
    port definition, see documentation to :mod:`rex.port`.

    Example::

        port: study?!closed

    This field is mandatory.

`gateway`
    The name of a gateway database.  If not set, the port is defined over the
    main application database.

    Example::

        gateway: input

`access`
    Permission required to access the port.  If not set, the permission of the
    package that owns the handler is assumed.

    Example::

        access: anybody

`unsafe`
    Enables CSRF protection for the port.  If enabled, the incoming request
    must contain a CSRF token.  By default, CSRF protection is disabled.

    Example::

        unsafe: true

`read-only`
    Prohibits CRUD operations on the port.  If enabled, only read-only queries
    can be executed on the port.  By default, CRUD operations are permitted.

    Example::

        read-only: true


Override handler
================

An override handler allows you to redefine some fields of an existing handler.
Thus you can only use an override handler for paths with an existing handler
defined in another configuration file.

An override handler is marked by a YAML tag ``!override``.  It may contain all
the fields of a template handler or a port handler:

    ``template``, ``context``, ``access``, ``unsafe``, ``parameters``.

    ``query``, ``parameters``, ``access``, ``unsafe``.

    ``port``, ``access``, ``unsafe``, ``read-only``.

None of the fields is mandatory.  Fields that are omitted are inherited from
the original template handler.

Example::

    !override
    context:
      title: Human research subjects

A port handler can also be overriden, in which case, the new definitions
are added to the original port description.  Example::

    !override
    port:
    - individual.identity
    - individual.participation

The complete file with this override definition may look like this::

    include:
    - /urlmap/study.yaml
    - /urlmap/individual.yaml

    paths:

      /individual: !override
        context:
          title: Human research subjects

      /data/individual: !override
        port:
        - individual.identity
        - individual.participation

The original handler for ``/individual`` is defined in
``/urlmap/individual.yaml``::

    paths:

      /individual:
        template: /template/list.html
        context:
          title: Individuals
          query: /individual{code, first_name+' '+last_name :as title}

      /data/individual:
        port: individual

      ...

In the first ``!override`` definition, we change the ``title`` context variable
to a new value.  All the other context variables and other parameters are
unchanged.

In the second ``!override`` definition, we add a nested ``identity`` record and
a list of ``participation`` records to each ``individual`` record.


Copy handler
============

A copy handler allows you to clone configuration of an existing handler.  This
lets you provide the same page under several URLs without duplicating the
entire page configuration.

The copy definition contains the path of the handler to copy.  For example::

    paths:

      /data/individual:
        port: individual

      /data/individuals:
        !copy /data/individual


