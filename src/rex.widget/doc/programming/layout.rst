.. _layout-components:

Layout components
=================

Rex Widget provides a set fo layout components based on flexbox_.

Layoutcomponents are exposed through the ``rex-widget/layout`` ES2015 module::

  import {VBox, HBox} from 'rex-widget/layout';

Component ``<VBox />`` renders its children vertically and ``<HBox />`` —
horizontally.

An entire set of flexbox/layout CSS properties is exposed through component
props::

  <VBox flex={1} alignItems="flex-end">
    <VBox>Hello</VBox>
    <VBox>World!</VBox>
  </VBox>

Consult flexbox_ documentation for the specifics.

.. _flexbox: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
