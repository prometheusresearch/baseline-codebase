****************************
  REX.WIDGET_CHROME
****************************

Overview
========

This package implements the default chrome for ``rex.widget``-based pages. It
is responsible for the main application menu and header contents.

To use it simply add the following setting::

  rex_widget:
    chrome: rex.widget_chrome.Chrome


This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

Application Menu
================

``menu`` setting declared in this package permits you to customize the
application menu. Here is an example of it::

  menu:
  - title: Home
    items:
    - url: rex.platform_demo:/
      title: Home Page
      access: anybody
  - title: Schools
    items:
    - url: rex.platform_demo:/school_admin
      access: admin
    - url: rex.platform_demo:/school_viewer
      access: viewer
      new_window: true

This is strictly 2-tier menu structure where the first level defines the list
of groups and each group defines the list of URLs. Every URL can have optional
``title`` (will be automativally taken from widget/wizard title if not
provided) and the ``new_window`` (default: false) flag. ``url`` and ``access``
attributes are required. If the handler on the specified URL had its own
``access`` attribute it'll be overridden with the one specified in the ``menu``
setting.


Application Look'n'feel
=======================

``rex.widget_chrome`` provides several settings permitting to customize application header appearance:

* ``application_title``: the application title to be displayed in the top-left
  corner

* ``application_banner``: the additional information to be displayed on
  application banner. May be useful for devops team to differentiate between
  various environments or notifying users

* ``header_primary_color`` and ``header_secondary_color``: colors used in a
  header for displaying top and bottom parts of the menu. Use CSS hexadecimal
  format: #NNN or #NNNNNN to specify.
