Theming
=======

Theming in Rex Widget allows to customize look'n'feel of UI. It is implemented
as a setting and thus can be configured by analysts easily.

Use ``rex_widget.theme`` setting key in ``settings.yaml`` to customize theming::

    rex_widget:
      theme:
        success_button:
          text_color: red


The example configuration above will turn text color to ``red`` of all success
button widgets.

The list of available theming keys is the following:

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

* ``success_button``

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

* ``danger_button``

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

* ``quiet_button``

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
