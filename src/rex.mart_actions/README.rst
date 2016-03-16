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

             **mart_tool:***: Set for each tool that is available for this Mart.

             **mart_defn:***: Set for the Definition of this Mart.

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

             **mart_defn:***: Set for the Definition that was selected.

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
              This action, much like ``mart-guide-export``, can be used as an
              endpoint for `Guided Queries`_. It will be pre-populated with the
              query that is built from the user's filtering and column
              selections.
    :Input: **mart**: The ID of the Mart to connect to.

            **mart_tool:htsql**: A flag that enables this tool so that it shows
            in the list of available Actions.
    :Output: N/A


Data Dictionary
---------------

There are a set of actions that allow a user to explore a Mart database's
data dictionary. Note that these actions only work if the Mart was configured
to use the ``datadictionary`` processor in ``rex.mart``.

``mart-dictionary``
    :Purpose: Acts as the entry point for the Data Dictionary set of actions.
    :Input: **mart_tool:dictionary**: A flag that enables this tool so that it
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


Guided Queries
--------------

There are a set of actions available that let the workflow author assemble
small workflows that guide a user through customizing and executing simple
queries on tables in Mart databases.

``mart-guide``
    :Purpose: Acts as the entry point for a Guided Query set of actions.
    :Input: **mart_tool:guide**: A flag that enables this tool so that it shows
            in the list of available Actions.
    :Output: N/A
    :Properties: **text**: The Restructured text to display on this page. This
                 property is optional.

                 **definition**: The Mart Definition that this guide should be
                 enabled for.

``mart-guide-filter``
    :Purpose: Allows the user to select from a list of configured filter
              criteria to use in the query.
    :Input: **mart**: The ID of the Mart to connect to.
    :Output: N/A
    :Properties: **table**: The table that the query is based on.

                 **definition**: The Mart Definition that this guide action can
                 operate on.

                 **filters**: The list of filters to allow the user to choose
                 from. This is a list of mappings that have two properties;
                 ``title`` and ``expression``.

``mart-guide-columns``
    :Purpose: Allows the user to select which columns should be returned by the
              query.
    :Input: **mart**: The ID of the Mart to connect to.
    :Output: N/A
    :Properties: **table**: The table that the query is based on.

                 **definition**: The Mart Definition that this guide action can
                 operate on.

                 **fields**: The list of additional, expression-based columns
                 that the user can choose from (in addition to all the normal
                 columns on the table). This is a list of mappings that two
                 properties: ``title`` and ``expression``. The ``expression``
                 must resolve to a scalar value -- nested record sets are not
                 currently supported.

``mart-guide-export``
    :Purpose: Allows the user to export the results of the query they've
              configured as a CSV or TSV file.
    :Input: **mart**: The ID of the Mart to connect to.
    :Output: N/A
    :Properties: **table**: The table that the query is based on.

                 **definition**: The Mart Definition that this guide action can
                 operate on.

                 **fields**: The list of additional, expression-based columns
                 that the user can choose from. If selected, these columns will
                 be added to the exported file, but will not be added to the
                 guided query itself (e.g., the query being displayed in the
                 preview panes). This is a list of mappings that have two
                 properties: ``title`` and ``expression``. Unlike the fields in
                 the Column Chooser action, these expressions can resolve to
                 either scalar or plural values.

Typically, these actions will be arranged as::

    - mart-guide:
      - repeat:
          - mart-guide-filter:
          - mart-guide-project:
        then:
          - mart-guide-export:

