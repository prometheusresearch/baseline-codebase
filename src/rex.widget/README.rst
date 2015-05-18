Configuration Guide
===================

Rex Widget adds a new type of URL mapping handler which can be used to define
application screens by composing predefined widgets::

  paths:
    /screen:
      access: anybody
      widget: !<ApplicationPage>
        title: Hello, world!
        children:
        - !<DataTable>
          data: package:/data

Visiting ``/screen`` URL will in a browser will show rendered screen.

Overrides
---------

The ``access`` and ``widget`` parameters of a handler are overridable as
documented in the Rex URLMap documentation.

For example one can override access configuration for a screen::

  paths:
    /screen: !override
      access: authenticated

or override an entire widget hierarchy::

  paths:
    /screen: !override
      widget: !<ApplicationPageWithCustomizations>

But overriding an entire widget hierarchy isn't practical in cases when you want
to alter configuration of just few parameters. Rex Widget provides more granular
override mechanism.

Granular overrides via slots
----------------------------

Rex Widget provides another override mechanism which allows to supply override
values deep inside the widget hierarchy without requiring to re-define an entire
hierarchy.

Not every parameter could be overridden but only those marked as *slots* within
the original URL mapping entry. Each slot has a name and a default value. The
special syntax ``!slot`` is used to define slots::

  paths:
    /screen:
      access: anybody
      widget: !<ApplicationPage>
        title: !slot
          name: page_title
          default: Hello, world!
        children:
        - !<DataTable>
          data: !slot
            name: data
            default: package:/data

The configuration snippet above defines two slots ``page_title`` and ``data``
which can be overridden via ``slots`` key in an override entry::

  paths:

    /screen: !override
      slots:
        page_title: Overridden title
