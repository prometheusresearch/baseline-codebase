Theming
=======

Theming in Rex Widget allows to customize look'n'feel of UI. It is implemented
as a setting and thus can be configured by analysts easily.

Use ``rex_widget.theme`` setting key in ``settings.yaml`` to customize theming::

    rex_widget:
      theme:
        button:
          text_color: red
        form:
          horizontal_field_spacing: 5
          vertical_field_spacing: 5
          condensed_layout: true

The example configuration above will turn text color to ``red`` of all success
button widgets.

The list of available theming keys is the following:

* ``form``

  - ``condensed_layout`` — try to render forms taking as little space as
    possible.
  - ``horizontal_field_spacing`` — override vertical spacing between form
    fields.
  - ``vertical_field_spacing`` — override horizontal spacing between form fields.

* ``button``

  - ``text_color``
  - ``background_color``
  - ``border_color``
  - ``hover``

    + ``text_color``
    + ``background_color``
    + ``border_color``

  - ``active``

    + ``text_color``
    + ``background_color``
    + ``border_color``

  - ``focus``

    + ``text_color``
    + ``background_color``
    + ``border_color``

  - ``disabled``

    + ``text_color``
    + ``background_color``
    + ``border_color``
