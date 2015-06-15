Configuration Guide
===================

Rex Widget provides a URL mapping handler named `widget`. 
With this handler you map a path to an 
application screen composed of predefined widgets::

  paths:
    /screen:
      access: anybody
      widget: !<ApplicationPage>
        title: Hello, world!
        children:
        - !<DataTable>
          data: package:/data

With this declaration, visiting ``/screen`` in your browser will 
render the ApplicationPage widget.

The ApplicationPage will be rendered with the title **Hello, world!**, 
and the data will be fetched from the **package:/data** port.

Overrides
---------

The ``access`` and ``widget`` parameters of a handler are overridable as
documented in `rex.urlmap`_.

For example one can override the access setting to the above ApplicationPage::

  paths:
    /screen: !override
      access: authenticated

You can override an entire widget hierarchy::

  paths:
    /screen: !override
      widget: !<ApplicationPageWithCustomizations>

Now when you visit /screen, the ApplicationPageWithCustomizations
widget will be rendered instead.

But overriding an entire widget hierarchy isn't practical 
when you only want to alter a few parameters. 
Rex Widget provides a more granular
override mechanism called "slots".

Granular overrides via slots
----------------------------

With slots you can override values deep inside a widget's hierarchy 
without re-defining the entire hierarchy.

Any field marked as a **slot** in the original URL mapping entry
may be overridden.  Each slot has a name and a default value. 
The special syntax ``!slot`` is used to define slots::

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

The configuration snippet above defines two slots 
named ``page_title`` and ``data``
which can be overridden via the ``slots`` key in an override entry::

  paths:

    /screen: !override
      slots:
        page_title: Overridden title

Now when you visit /screen, the ApplicationPage will render 
with the title **Overridden title**.

.. _rex.urlmap:  ../rex.urlmap/index.html

