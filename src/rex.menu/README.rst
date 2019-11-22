************************
  REX.MENU Usage Guide
************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: func(literal)
.. role:: class(literal)


Overview
========

This package lets the application developer:

* define a hierarchical application menu;
* for each menu item, define access permissions and the menu handler.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Introduction
============

A GUI application is a collection of informational screens, item listings, edit
dialogs and other interactive pages.  To present this collection to the user,
we employ a hierarchical application menu.

An application menu is a catalog of available application pages organized in a
hierarchical structure.  Each entry in the catalog, a menu item, has a number
of properties:

* the title;
* access permissions;
* menu handler, that is, an application page to display when the user selects
  the menu item;
* a collection of subordinate menu items.

The :mod:`rex.menu` package lets you define the application menu.  Note that
:mod:`rex.menu` does not render the application menu on the page; this is a job
of an application *chrome*.

Let us show how a typical application menu is defined.  We will use
:mod:`rex.widget` and :mod:`rex.action` to implement menu handlers.

Suppose the application has a number of pages, among them, the *Welcome* page
and *My Account* page.  For each page, we define a menu item record in a YAML
format.  For example, the *Welcome* page can be represented as follows::

    title: Welcome
    path: /
    access: anybody
    action:
      title: Welcome!
      type: page
      text: |
        Welcome to the ``rex.menu`` demo!


This menu item is described by a record with four attributes:

`title`
    The name of the menu item as it is shown to the user.
`path`
    The URL of the page.
`access`
    Specifies the class of users that are allowed to see the page.
`action`
    Describes the page using :mod:`rex.action` framework.

Action definitions often take considerable space and, sometimes, can be reused
between applications.  Because of that, it is convenient to move the action
definition to a separate file and add it to the menu item using the
``!include`` directive.  For example, *My Account* menu item can be defined as
follows::

    title: My Account
    action: !include ./menu/my-account.yaml

In this menu item definition, we omit both `path` and `access` fields.  When
`path` is omitted, the page URL is generated from the item title (in this
example, the generated URL is ``/my-account``).  If `access` field is omitted,
the page inherits its permissions from the parent menu item.  The default
access permission is *authenticated*, which allows any authenticated user to
see the page.

Now let us place these two menu items in a group called *Home*.  Here is what
we get::

    title: Home
    items:

    - title: Start
      path: /
      access: anybody
      action:
        title: Welcome!
        type: page
        text: |
          Welcome to the ``rex.menu`` demo!

    - title: My Account
      action: !include ./menu/my-account.yaml

A menu group is a menu item with a field ``items``, which should contain a list
of subordinate menu items.

Finally, we place the menu definition to a static file ``menu.yaml``.  This
file contains a single field `menu` with a list of top-level menu items::

    menu:

    - title: Home
      items:

      - title: Start
        path: /
        access: anybody
        action:
          title: Welcome!
          type: page
          text: |
            Welcome to the ``rex.menu`` demo!

      - title: My Account
        action: !include ./menu/my-account.yaml

    - title: Individuals
      access: phi_access
      items:

      - title: Manage individuals
        path: /individual
        action: !include
          rex.menu_demo:/menu/manage-individuals.yaml

      - title: Explore
        path: /explore
        widget: !<IFrame>
          src: rex.db:/

    - title: Users
      access: user_access
      items:

      - title: Manage Users
        path: /user
        action: !include
          rex.menu_demo:/menu/manage-users.yaml

    - title: Documentation
      access: anybody
      external: http://doc.example.com/
      new_window: true

In this example, the application menu contains three menu groups: *Home*,
*Individuals* and *Users*, and a top-level menu item *Documentation*.

We already described the *Home* group, and the *Individuals* and *Users* groups
are not much different.  We only note that to describe the page handlers,
besides :mod:`rex.action`, we can also use :mod:`rex.widget` library, like in
the *Explore* menu item::

    title: Explore
    path: /explore
    widget: !<IFrame>
      src: rex.db:/

The *Documentation* menu item redirects the user to an external URL, which is
specified with the `external` field::

    title: Documentation
    access: anybody
    external: http://doc.example.com/
    new_window: true


Application interface
=====================

To introspect the structure of the application menu at runtime, we use function
:func:`rex.menu.get_menu()`.

Here is an example.  We start with creating and activating an application
object::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.menu_demo')
    >>> demo.on()

Now we can get the menu object.  The :func:`rex.menu.get_menu()` function loads
the menu configuration from a ``rex.menu`` file::

    >>> from rex.menu import get_menu

    >>> menu = get_menu()

We can easily traverse the menu structure::

    >>> for item in menu:
    ...     print((item.title))
    Home
    Individuals
    Studies
    Users
    Search

We also have access to the routing table generated by the menu::

    >>> for mask in menu.route:
    ...     print(mask)              # doctest: +ELLIPSIS
    /
    /explore
    /individual
    /search
    ...
    /study/closed/@@/*

:mod:`rex.menu` provides only one built-in type of a menu handler: external
links.  Other menu handlers are defined in :mod:`rex.widget` and
:mod:`rex.action` packages.  To register a custom handler type, you must
implement the :class:`rex.menu.Menu` interface.


The ``menu.yaml`` file format
=============================

The ``menu.yaml`` file may contain the following fields:

`access`
    The default access permission for menu items.  Individual menu items can
    override this value.

    If not set, the default access permission is *authenticated*, which allows
    access by any authenticated user.

`menu`
    A sequence of top-level menu items.

Each menu item may contain the following fields:

`title`
    The name of the menu item.  This field is mandatory.

`new_window`
    Indicates whether the page should open in a new browser window.

`access`
    Access permission for the page served by this menu item.

    Also specifies the default permission for subordinate menu items, if any.

`items`
    A list of subordinate menu items.

Each menu item may have an associated application page.  The following page
types are supported by :mod:`rex.menu`, :mod:`rex.widget`, and
:mod:`rex.action` packages:

`external`
    Redirects the user to the specified URL.

`widget`
    Renders a widget using :mod:`rex.widget`.

`action`
    Renders an action wizard using :mod:`rex.action`.




