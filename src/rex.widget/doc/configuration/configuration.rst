Configuring widgets
===================

Rex Widget provides a URL mapping handler named `widget`. With this handler you
map a path to an application screen composed of predefined widgets::

  paths:
    /screen:
      access: anybody
      widget: !<ApplicationPage>
        title: Hello, world!
        children:
        - !<DataTable>
          data: package:/data

With this declaration, visiting `/screen` in your browser will render the
ApplicationPage widget.

The ApplicationPage will be rendered with the title **Hello, world!**, and the
data will be fetched from the **package:/data** port.

Overrides
---------

The `access` and `widget` parameters of a handler are overridable as documented
in `rex.urlmap`_.

For example one can override the access setting to the above ApplicationPage::

  paths:
    /screen: !override
      access: authenticated

You can override an entire widget hierarchy::

  paths:
    /screen: !override
      widget: !<ApplicationPageWithCustomizations>

Now when you visit /screen, the ApplicationPageWithCustomizations widget will be
rendered instead.

.. _rex.urlmap:  ../../rex.urlmap/latest/index.html

