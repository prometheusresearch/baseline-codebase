******************************
REX.TABULAR_IMPORT Usage Guide
******************************

.. contents:: Table of Contents


Overview
========

This package contains a set of APIs and ``rex.ctl`` tasks that facilitate the
import of tabular flat files into tables in a RexDB database.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Using the Command-Line Tools
============================

A typical usage of the tools in this package starts with the
``tabular-import-template`` command.  This command will produce a file that can
act as a starting point for creating the file that will eventually be imported
into the database. This template file can be in CSV, TSV, or XLS format, and
contains two lines: the first being a series of headers corresponding to the
columns in the table, the second being descriptions of these columns, including
their data types, constraints, etc.

To create a template import file for use with the ``individual`` table in the
RexStudy database, you'd do the following::

    $ rex tabular-import-template individual > individual.csv

    $ cat individual.csv
    code,sex,mother,father,adopted_mother,adopted_father
    Primary Key; Required (Has Default); Text,"Required (Has Default); One of: not-known, male, female, not-applicable",An Identifier from the individual table,An Identifier from the individual table,An Identifier from the individual table,An Identifier from the individual table

The next step is to execute the import process. To do this you need a file
that:

* Is formatted as either CSV, TSV, or XLS
* Has the first row populated with the names of the columns of the target table
* Has a column that corresponds with every column in the target table
* Has data starting on the second line of the file

If you used the ``tabular-import-template`` command as a starting point, the
file it creates addresses the first three requirements. To make it fully
compliant, remove the second line of the template (the line that contains the
column descriptions) and begin entering data on that line.

To import the file into the database, you'd do the following::

    $ cat individual.csv
    code,sex,mother,father,adopted_mother,adopted_father
    IND1,male,,,,
    IND2,male,,,,
    IND3,female,,IND2,,

    $ rex tabular-import individual individual.csv
    3 records imported into individual

    $ rex shell
    Type 'help' for more information, 'exit' to quit the shell.
    rexstudy$ /individual[IND3]
     | Individual                                                        |
     +------+--------+--------+--------+----------------+----------------+
     | Code | Sex    | Mother | Father | Adopted Mother | Adopted Father |
    -+------+--------+--------+--------+----------------+----------------+-
     | IND3 | female |        | IND2   |                |                |

