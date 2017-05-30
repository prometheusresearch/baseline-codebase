****************************
REX.MART_ACTIONS Usage Guide
****************************

.. contents:: Table of Contents


Overview
========

This package provides a collection of RexMart exploration tools implemented as
a series of ``rex.action`` custom Actions.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Actions
=======

Mart Selection
--------------
There are a set of actions that are intended to be used as the means for the
user to select the Mart database they wish to explore.

``mart-pick``
    :Purpose: Allows the user to select a specific Mart database from a list of
              those that they have access to.
    :Input: **mart_definition**: The ID of the Definition to limit the list of
            Marts to. This context is optional; if not specified, all Marts the
            user has access to will be listed.
    :Output: **mart**: The ID of the Mart database that was selected.

             **mart_tool__***: Set for each tool that is available for this Mart.

             **mart_defn__***: Set for the Definition of this Mart.

``mart-details``
    :Purpose: Shows details about a Mart database. If the user has management
              permissions on the Mart, they will have access to buttons that
              allow them Pin and/or Delete the database.
    :Input: **mart**: The ID of the Mart database to show.
    :Output: N/A

``mart-definition-pick``
    :Purpose: Allows the user to select a Mart Definition that they have access
              to. Intended for use prior to the ``mart-pick`` action so that
              you can implement a tiered approach to Mart selection.
    :Input: N/A
    :Output: **mart_definition**: The ID of the Mart Definition that was
             selected.

             **mart_defn__***: Set for the Definition that was selected.

``mart-definition-details``
    :Purpose: Shows details about a Mart Definition. If the user has the
              permissions to do so, they will have access to buttons that allow
              them to Create a new Mart database.
    :Input: **mart_definition**: The ID of the Mart Definition to show.
    :Output: N/A

Typically, these actions will be arranged as::

    - mart-pick:
      - mart-details:
      - ...

Or::

    - mart-definition-pick:
      - mart-pick:
        - mart-details:
        - ...
      - mart-definition-details:

It is recommended that the ``mart-details`` action be followed with a
``replace`` parameter so that RexAction knows where to direct to the user after
the user chooses to delete the Mart.


HTSQL Console
-------------
``mart-htsql-console``
    :Purpose: Provides a web-based HTSQL console connected to a Mart database.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_tool__htsql**: A flag that enables this tool so that it shows
            in the list of available Actions.
    :Output: N/A


Data Dictionary
---------------
There are a set of actions that allow a user to explore a Mart database's
data dictionary. Note that these actions only work if the Mart was configured
to use the ``datadictionary`` processor in ``rex.mart``.

``mart-dictionary``
    :Purpose: Acts as the entry point for the Data Dictionary set of actions.
    :Input: **mart_tool__dictionary**: A flag that enables this tool so that it
            shows in the list of available Actions.
    :Output: N/A
    :Properties: **text**: The Restructured text to display on this page. This
                 property is optional.

``mart-dictionary-tables``
    :Purpose: Lists the tables that are available in the Mart database.
    :Input: **mart**: The ID of the Mart to connect to.
    :Output: **mart_table**: The table that was selected.

``mart-dictionary-table-details``
    :Purpose: Shows details about a table in the Mart database.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_table**: The table to display.
    :Output: N/A

``mart-dictionary-table-columns``
    :Purpose: Lists the columns that are on a particular table in the Mart
              database.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_table**: The table to examine.
    :Output: **mart_column**: The column that was selected.

``mart-dictionary-column-details``
    :Purpose: Shows details about a column in the Mart database.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_column**: The column to display.

``mart-dictionary-enumerations``
    :Purpose: Lists the enumerations that are available for a particular
              column in the Mart database.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_column**: The column to examine.
    :Output: **mart_enumeration**: The enumeration that was selected.

``mart-dictionary-columns``
    :Purpose: Lists all the columns that are available in the Mart database.
    :Input: **mart**: The ID of the Mart to connect to.
    :Output: **mart_column**: The column that was selected.

Typically, these actions will be arranged as::

    - mart-dictionary:
      - mart-dictionary-tables:
        - mart-dictionary-table-columns:
          - mart-dictionary-column-details:
          - mart-dictionary-enumerations:
        - mart-dictionary-table-details:
      - mart-dictionary-columns:
        - mart-dictionary-column-details:
        - mart-dictionary-enumerations:


RexGuide (aka, Guided Queries)
------------------------------
``mart-guide``
    :Purpose: Provides a limited, simple interface for a user to query a flat
              table and optionally export its data.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_tool__guide**: A flag that enables this tool so that it shows
            in the list of available Actions.
    :Output: N/A
    :Properties: **definition**: The Mart Definition that this Guide can
                 operate on. Required.

                 **table**: The table that the query is based upon. Required.

                 **text**: Restructured text to display in the Help pane.
                 Optional.

                 **fields**: The fields that a user can choose from to retrieve
                 in their query. This is a list of three kinds of mappings. If
                 not fields are specified, this will default to showing all
                 compatible fields on the base ``table``. Allowed mappings:

                 *Includes*

                 These mappings add existing fields from the base ``table`` (or
                 facets of the base table) to the list. They have three
                 properties:

                   ``include``: The name of the field include. Required. This
                   can either be:

                     * The name of a specific field on the table (e.g.,
                       ``foo``)
                     * The name of a specific field on a facet table (e.g.,
                       ``my_facet.some_field``)
                     * An asterisk (``*``), which will include all fields from
                       the table
                     * An asterisk on a facet table (e.g., ``my_facet.*``),
                       which will include all fields from the facet table

                   ``title``: The title of the field to display. Optional.

                   ``selected``: Whether or not this field is displayed upon
                   first accessing the guide. If not specified, defaults to
                   ``true``.

                 *Excludes*

                 These mappings will exclude fields that were brought into
                 scope by Includes. For example, you could use
                 ``- include: '*'`` to include all columns from the base table,
                 and then use ``- exclude: foo`` to prevent the ``foo`` field
                 from being brought in via the asterisk. These mappings just
                 have one property:

                   ``exclude``: The name of the field to exclude. Required.

                 *Expressions*

                 These mappings allow you to add calculated fields to the
                 query. They have three properties:

                   ``expression``: The HTSQL expression that calculates the
                   field value. Must result in a scalar value. Required.

                   ``title``: The title of the expression to display. Required.

                   ``selected``: Whether or not this field is displayed upon
                   first accessing the guide. If not specified, defaults to
                   ``true``.

                 **filters**: The filters that a user can choose to apply to
                 the query. This is a list of mappings that contain two keys;
                 ``expression``, which specifies the HTSQL expression to filter
                 on, and ``title``, which is the label of the filter to show
                 in the Filter pane. If no filters are specified, this will
                 default to filtering all compatible fields defined in the
                 ``fields`` property.

                 **masks**: The HTSQL filter conditions to always apply to the
                 query. This is a list of HTSQL expressions that will be used
                 in ``filter()`` calls. Optional.

                 **allowed_exporters**: The data exporters to show on the
                 Download pane. This is a list of strings (``csv``, ``tsv``,
                 ``xls``, ``xlsx``). If not specified, defaults to all
                 available exporters.

                 **preview_record_limit**: The maximum number of records to
                 show in the Preview pane. If not specified, no limit is
                 applied.


Visual Query Builder
--------------------
``mart-query-builder``
    :Purpose: Displays the QueryBuilder application connected to the specified
              Mart.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_tool__vqb**: A flag that enables this tool so that it shows
            in the list of available Actions.
    :Output: N/A

