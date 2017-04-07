********************
REX.MART Usage Guide
********************

.. contents:: Table of Contents
   :depth: 2


Overview
========

This package provides tooling to create configurable "Mart" databases, which
are read-only databases that are optimized for reporting and analysis. It
contains functionality that handles simple, repeatable ETL workflows, as well
as functionality that can flatten RIOS Assessment Documents into relational
tables.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Mart Creation Process
=====================

The creation of every Mart follows the same six phase process. All phases after
the first are optional.

1. Creation
    This phase establishes the database that the Mart creation will occur in.
    Configuration authors can specify the creation of a brand new database,
    the cloning of an existing database, or build into an existing database.

2. Deployment
    This phase executes a ``rex.deploy`` configuration that will create any
    data structures needed to contain the data loaded by the non-Assessment ETL
    phases.

3. Phase 1 ETL
    This phase consists of executing a list of HTSQL and/or SQL scripts
    specified by the configuration author. Any number of scripts can be
    specified; they will be executed in the order defined, and each will be
    executed within its own transaction. Typically, the scripts in this phase
    will load all the non-Assessment data needed in the Mart.

4. Assessment ETL
    This phase consists of retrieving `RIOS`_ Assessments from the associated
    RexDB application and transforming their contents into a set of relational
    tables in the Mart. Authors can specify which Instruments to include, how
    to identify the Assessments to include, which fields from the Instrument to
    include, and how to parent the resulting table to tables created in the
    Deployment phase.

    .. _`RIOS`: https://rios.readthedocs.org

5. Phase 2 ETL
    This phase consists of executing a list of HTSQL and/or SQL scripts
    specified by the configuration author (different/separate from those
    defined in Phase 1). Any number of scripts can be specified; they will be
    executed in the order defined, and each will be executed within its own
    transaction. Typically, the scripts in this phase will perform any
    calculations or aggregations upon the data loaded by Phase 1 ETL and
    Assessment ETL.

6. Post-Processing
    This phase will execute any number of Python extensions that can be
    implemented by other packages. These extensions could provide
    common/generic functionality that cab be shared across different Mart
    definitions. This includes things such as Data Dictionary
    construction/loading, index creation, or basic Mart statistics (row counts,
    null counts, enumeration counts, etc).


Owners, Quotas, and Pinning
===========================

Every Mart created by this package is explicitly assigned an "Owner". This
Owner is specified during its creation. Within the ``rex.mart`` tables and
logic, Owners are nothing more than string identifiers. Their meaning is
completely dependent on how this package is integrated with the host RexDB
application. In most cases, "Owners" will be Users of the application.

The ``rex.mart`` system enforces what is called a Quota for each Owner in the
system. This Quota limits the number of Mart databases that the Owner can
possess at any given time in the system. Currently, this Quota is enforced in
two ways:

* Limiting the number of Marts that can be created from a particular Mart
  Definition for an Owner.
* Limiting the number of Marts that an Owner can have in total.

Each time a Mart is being created, the system will first check to see if
creating the requested Mart will result in violating the Owner's Quota. If it
will, then creation is aborted. After a Mart is created, the system will then
check to see if the Owner has exceeded their Quota. If they have, then their
oldest Mart will be purged from the system to put them back under their Quota.

Owners (or anyone who has access to "manage" a Mart) have the ability to "pin"
a Mart. Pinning a Mart will exclude it from the automatic purging process that
occurs as part of Quota enforcement. Even though Pinned Marts are excluded from
the purging process, they still count against the Owner's Quota. So, if the
system is configured to only allow 3 Marts, and the Owner has pinned 3 Marts,
then they will not be allowed to create any new Marts until they have unpinned
or manually purged a Mart.


Configuration
=============

The configuration of the ``rex.mart`` package is primarily driven by a YAML
file named ``mart.yaml`` that is stored at the root of the static file
directory of a RexDB Python package. Any number of packages within an
application instance can contain ``mart.yaml`` files, and they will be
automatically merged so that all definitions are available in the resulting
application.

The contents of the ``mart.yaml`` file is a YAML mapping that currently
supports one property: ``definitions``. This property accepts a list of Mart
Definition mappings.

Mart Definitions
----------------
A Mart Definition is the core of the configuration that describes how a Mart
database is created. It consists of the following properties:

id
``
The ``id`` property specifies a unique identifer for the definition that can be
referenced by other parts of the application. It is the only required property.

label
`````
The ``label`` property specifies a human-readable name that can be shown in the
GUI in reference to the Definition. If not specified, it defaults to the same
value that is used in the ``id`` property.

description
```````````
The ``description`` property specifies a human-readable description that can be
shown in the GUI that describes what this Definition does or what it is made up
of.

base
````
The ``base`` property contains the information needed to specify either which
database to build the Mart in, or how to create the database to build the Mart
in. This property is a mapping that contains the following sub-properies:

type
    This property indiciates which method to use to establish the database. It
    accepts the following values:

    * ``fresh``: Create a brand new database
    * ``copy``: Create a brand new database by copying an existing one
    * ``application``: Create a brand new database by copying the main RexDB
      application database
    * ``existing``: Build the Mart in an existing database

    If not specified, this property defaults to ``fresh``.

    Note that using ``copy``, ``application``, and ``existing`` requires the
    referenced database to be in the same database system as is specified by
    the ``mart_hosting_cluster`` application setting.

    Furthermore, the ``copy`` and ``application`` methods require that there be
    no connections to the referenced database when the Mart is being created.
    This means that you cannot use these methods to copy the database of an
    actively-running application.

target
    When the ``copy`` or ``existing`` type is specified, this property
    identifies which database should be copied or built into. Note that this
    database must be in the same database system as is specified by the
    ``mart_hosting_cluster`` application setting.

name_token
    This property specifies the string that should be used as part of the name
    of the new database. If not specified, this property defaults to the value
    of the ``id`` of the Definition.

fixed_name
    This property specifies the name that should be used for the newly created
    database instead letting ``rex.mart`` automatically generate one. When this
    property is used, there can only ever be one Mart database that exists
    based on this Definition.

quota
`````
The ``quota`` property contains information about the limits to enforce in the
Quota rules for this particular Definition. This property a mapping that
contains the following sub-properties:

per_owner
    This property specifies the maximum number of Mart databases that a single
    Owner may have. If not specified, this property defaults to the value of
    the ``mart_default_max_marts_per_owner_definition`` application setting.

deploy
``````
The ``deploy`` property contains a list of ``rex.deploy`` Facts that will be
executed as part of the Deployment phase.

parameters
``````````
The ``parameters`` section defines a list of parameters that can be supplied
during the creation of Mart. These parameters are made available as variables
in the HTSQL/SQL queries defined by the ``post_deploy_scripts`` and
``post_assessment_scripts`` properties, as well as the HTSQL
queries/expressions defined in the ``selector`` and ``post_load_calculations``
properties of an ``assessment``. Each definition in the list is a mapping that
accepts the following properties:

name
    The name of the parameter that will be passed through to the queries. This
    property is required and is case sensitive.

type
    The datatype of the value that will be collected by this parameter.
    Incoming values are automatically validated prior to passing them to the
    queries. This property is required.

    The possible datatypes that can be specified here are: ``text``,
    ``integer``, ``float``, ``boolean``, ``date``, ``time``, ``dateTime``.

default
    The default value to associate with this parameter if it is not passed into
    the Mart Creation process. This property is optional, and if not specified,
    the parameter is assumed to be required, and will cause failures if the
    Mart Creation process does not receive this parameter.


post_deploy_scripts
```````````````````
The ``post_deploy_scripts`` contains a list of script definitions that specify
the statements to execute within the Mart database, presumably to perform the
ETL activities needed to populate the Mart. These scripts will be executed in
the specified order after the Deployment phase. Each script definition in the
list is a mapping that accepts the following properties:

script
    This property contains the actual HTSQL or SQL statement(s) that will be
    executed in the Mart database. This property is required.

type
    This property identifies the language used in the ``script`` property. It
    accepts the values ``htsql`` or ``sql``. This property is required.

parameters
    This property is a mapping that allows you to specify variables that will
    be made available to your script. Regardless of what is specified in this
    property, your scripts will always have access to two variables: ``OWNER``
    and ``DEFINITION``.

    In HTSQL scripts, these variables can be accessed by prepending their name
    with a ``$`` (e.g., ``$OWNER``). In SQL scripts, these variables can be
    accessed by using the ``pyformat`` paramstyle that you would use in the
    Python DB API methods (e.g., ``%(OWNER)s``).

All scripts are executed in the Mart database itself (which is a separate
database from the main RexDB application database). HTSQL scripts will be
executed in an environment that has the ``rex_deploy`` and ``tweak.etl``
extensions loaded, as well as the extensions specified by the
``mart_etl_htsql_extensions`` application setting. The HTSQL environment will
also have a gateway defined named ``rexdb`` that will point to the main RexDB
application database. There will also be any gateways defined by the
``mart_etl_htsql_gateways`` application setting.

assessments
```````````
The ``assessments`` property contains a list of mappings that define how to
load RIOS assessments into the Mart. Each of these mappings accept the
following properties:

instrument
    This property specifies which Instrument (or Instruments) will have
    Assessments loaded. If this specifies an Instrument with multiple Versions,
    or multiple different Instruments, all Instrument Definitions involved will
    be merged such that the data from their respective Assessments is loaded
    into a single set of relational tables. If the string ``@ALL`` is specified
    for this property, then all Instruments found in the system that are active
    and have at least one InstrumentVersion will be included in the Mart. This
    property is required.

name
    This property specifies the base name of the table that the Assessments
    should be loaded in. If not specified, it takes the name of the first
    Instrument listed in the ``instrument`` property. Not allowed if using
    ``@ALL`` instruments.

selector
    This property specifies an HTSQL query that will be run in the Mart that
    will identify the UIDs of the Assessments that should be loaded into the
    database. This property is required. It must either be a string containing
    the query, or a mapping that accepts two properties:

    * query: The HTSQL query. This property is required.
    * parameters: This property is a mapping that allows you to specify
      variables that will be made available to your query. Regardless of what
      is specified in this property, your query will always have access to
      three variables: ``OWNER``, ``DEFINITION``, and ``INSTRUMENT``.

    The query must return at least one column that is named ``assessment_uid``
    (which is where the UIDs should be). Any other columns returned by this
    query will automatically be appened to the base Assessment table.

parental_relationship
    This property is mapping that describes how to relate the base Assessment
    table to other tables already in the Mart. It accepts the following
    properties:

    type
        This property indiciates the type of relationship the base Assessment
        table will have. It accepts the values: ``trunk``, ``facet``,
        ``branch``, ``cross``, ``ternary``.

    parent
        If the ``type`` specified is not ``trunk``, then this property
        specifies the names of the table(s) that will be the parents to the
        base Assessment table.

    If this property is not specified, the base Assessment table will be
    created as a trunk table.

    If this property is used to specify a relationship type that is not
    ``trunk``, then the query specified in the ``selector`` property must
    include columns that are named the same as the parent tables. These columns
    must have the keys of the parent records to link the Assessments to.

identifiable
    This property indiciates whether or not to include fields that have been
    marked in the Instrument and/or Calculation Set definitions as being
    "identifiable". It accepts the following values:

    * ``none``: Do not include any field marked as identifiable
    * ``only``: Only include fields that are marked as identifiable
    * ``any``: Do not filter any fields based on an identifiable marking

fields
    This property is a list that specifies which fields from the Instrument to
    include. If this property is set to ``null``, then no Instrument fields are
    included. If this property is not specified, then all Instrument fields
    are included. Not allowed if using ``@ALL`` instruments.

calculations
    This property is a list that specifies which fields from the Calculation
    Set to include. If this property is set to ``null``, then no Calculation
    Set fields are included. If this property is not specified, then all
    Calculation Set fields are included. Not allowed if using ``@ALL``
    instruments.

meta
    This property is a list that specifies which metadata fields from the
    Assessment Documents to include. Each field in this list can either be
    specified with simply the field name, or a mapping of the field name to
    the data type of the data contained in the field (e.g., ``- myfield`` or
    ``- myfield: integer``). If no datatype is specified, ``text`` will be
    used.

    If a metadata field is specified that is one of the RIOS standard fields,
    then whatever datatype is specified (or not specified) is ignored and the
    appropriate type (per the RIOS specification) is used.

    The possible datatypes that can be specified here are: ``text``,
    ``integer``, ``float``, ``boolean``, ``date``, ``time``, ``dateTime``.

post_load_calculations
    This property is a list that specifies a series of additional,
    HTSQL-expression-based fields to add on to the base Assessment table. It
    allows you to add columns to the Assessment table that are populated with
    values that are calculated based of the values of fields within the
    Assessment itself. Not allowed if using ``@ALL`` instruments. Each one of
    these field definitions accepts the following properties:

    name
        This property specifies the name of the field to add to the table. This
        property is required.

    type
        This property specifies the datatype of the field to add to the table.
        Accepts the values: ``text``, ``integer``, ``float``, ``boolean``,
        ``date``, ``time``, ``dateTime``. This property is required.

    expression
        This property specifies the HTSQL expression to use to calculate the
        value that should be stored in the field.


As an alternative to explicitly declaring the configuration of assessments in
the Mart Definition, you can add an entry to the ``assessments`` property that
instructs ``rex.mart`` to retrieve assessment configurations via a Definer
extension. This kind of entry accepts the following properties:

dynamic
    This property identifies which Definer to execute. This property is
    required.

options
    This property is a mapping that allows you to specify options to pass into
    the execution of the Definer. The options allowed here vary from Definer
    to Definer.


post_assessment_scripts
```````````````````````
The ``post_assessment_scripts`` property functions exactly like the
``post_deploy_scripts`` property, except that the scripts defined in it are
executed after the Assessment ETL phase.


processors
``````````
The ``processors`` property contains a list of processor definitions that
specify the Python Post-Processors to execute upon the Mart. Each processor
definition in the list is a mapping that accepts the following properties:

id
    This property identifies which Post-Processor to execute. This property is
    required.

options
    This property is a mapping that allows you to specify options to pass into
    the execution of the Processor. The options allowed here vary from
    Processor to Processor.


Application Settings
====================

The ``rex.mart`` package exposes a number of application settings that can be
set to adjust various attributes of its execution.

``mart_hosting_cluster``
    This is an HTSQL connection string that points to the database system
    where the Mart databases will be created. If not specified, then the Marts
    will be created in the same database system as the main RexDB application
    database. NOTE: For validation's sake, this connection string will require
    that you specify a database name, but the database does not actually need
    to exist.

``mart_name_prefix``
    This setting specifies the string to use as a prefix to the names of Mart
    databases that are created. If not specified, it defaults to ``mart_``.

``mart_htsql_extensions``
    This setting is structured identically to the ``htsql_extensions`` setting
    exposed by the ``rex.db`` package, but instead specifies the HTSQL
    extensions that will be made available in the HTSQL endpoints for the Mart
    databases. The ``rex_deploy`` and ``tweak.meta`` extensions will always
    be enabled, regardless of what this setting specifies.

``mart_etl_htsql_gateways``
    This setting is structured identically to the ``gateways`` setting exposed
    by the ``rex.db`` package, but instead specifies the HTSQL gateways that
    are made available to the ETL scripts executed by the Mart creation
    process. One gateway named ``rexdb`` will automatically be defined to point
    at the main RexDB application database (you don't need to define it here).

``mart_etl_htsql_extensions``
    This setting is structured identically to the ``htsql_extensions`` setting
    exposed by the ``rex.db`` package, but instead specifies the HTSQL
    extensions that will be made available to the ETL scripts executed by the
    Mart creation process. The ``rex_deploy`` and ``tweak.etl`` extensions will
    always be enabled, regardless of what this setting specifies. If not
    specified, this setting enables the ``tweak.meta`` extensions.

``mart_max_columns``
    This setting specifies the maximum number of columns the automatically-
    created Assessment tables can have. If not specified, defaults to ``1000``.

``mart_max_name_length``
    This setting specifies the maximum number of characters a table or column
    name can have. If not specified, defaults to ``63``.

``mart_max_marts_per_owner``
    This setting specifies the maximum number of Marts a single Owner can have
    at one time in the system (as enforced by the Quota rules). If not
    specified, defaults to ``10``.

``mart_default_max_marts_per_owner_definition``
    This setting specifies the maximum number of Marts a single Owner can have
    per Mart Definition, if the Definition doesn't explicitly establish this
    threshold on its own. If not specified, defaults to ``3``.

``mart_allow_runtime_creation``
    This setting specifies whether or not to enable the APIs that allow users
    to request creation of new Marts via the front-end application. If not
    specified, defaults to ``False``. NOTE: Simply enabling this setting does
    not enable the functionality of runtime Mart creation. You will need to
    make sure that a ``rex.asynctask`` worker is running to receive and process
    these requests.

``mart_runtime_creation_queue``
    This setting specifies the ``rex.asynctask`` queue name to use to submit
    the Mart creation tasks that result from the requests of the front-end
    application.

``mart_htsql_cache_depth``
    This setting specifies how many HTSQL connections will be cached by the
    web API. If not specified, defaults to ``20``.


Command-Line Tools
==================

This package exposes a handful of ``rex.ctl`` command line tasks to help manage
Mart databases. Be sure to read the built-in help information for each command
before using it (e.g. ``rex help mart-create``).

mart-create
    This task allows you to create Mart databases via the command-line. You can
    either specify the Owners and Definitions via command-line options, or by
    pointing this task to a RunList file.::

        $ rex mart-create --owner=someuser --definition=my_definition

        $ rex mart-create --owner=someuser --owner=otheruser --definition=my_definition

        $ rex mart-create --owner=someuser --definition=other_definition --param=foo=bar

        $ rex mart-create --runlist=path/to/runlist.yaml

    RunList files are YAML files that are lists of mappings that describe the
    Mart to create. Each of the mappings in this list accept the following
    properties:

    owner
        The Owner to assign the Mart to. This property is required

    definition
        The Mart Definition to use to create the Mart. This property is
        required.

    halt_on_failure
        Indicates whether or not to stop processing the rest of the RunList if
        this particular Mart fails. If not specified, defaults to ``False``.

    purge_on_failure
        Indicates whether or not to purge the database from the system if this
        particular Mart fails. If not specified, defaults to ``True``.

    leave_incomplete
        Indicates whether or not to leave the status of this Mart in an
        incomplete status after creating it. If not specified, defaults to
        ``False``.

    parameters
        The mapping of Mart Definition creation parameters to their values.

mart-shell
    This task will open an HTSQL shell to the specified Mart database. You can
    identify the Mart to connect to by specifying its name, its unique ID, or
    its owner & definition.::

        $ rex mart-shell mart_database_name

        $ rex mart-shell someuser -r my_definition@latest

mart-purge
    This task will delete specified Mart databases from the system. You can
    identify the Marts to delete by specifying owners, definitions, names, or
    unique IDs.::

        $ rex mart-purge --owner=someuser

        $ rex mart-purge --name=mart_database_name

        $ rex mart-purge --all


Run-Time Mart Creation
======================

TBD


Web APIs
========

The ``rex.mart`` package exposes a collection of RESTful APIs as well as HTSQL
endpoints that allow web-based applications to access and operate on Marts in
the system.

/definition
-----------

A GET will retrieve a collection listing all Definitions the calling user has
access to.

/definition/{definition_id}
---------------------------

A GET will retrieve details about the specified Definition, as well as a list
of Marts that were created with that Definition that the user has access to.

A POST will request that a Mart be created using the specified Definition. The
POST body allows an object with two optional parameters:

* purge_on_failure: Whether or not to purge the remnants of the Mart if
  creation fails at any point. Defaults to ``true``.
* leave_incomplete: Whether or not to leave the status of the Mart as not
  "complete" when the creation has actually completed. Defaults to ``false``.

/definition/{definition_id}/{latest_or_index}
---------------------------------------------

An HTSQL endpoint that is connected to the Mart described by the path
parameters:

* definition_id: The ID of the Definition that was used to create the Mart
* latest_or_index: Either the literal string "latest" which indicates that you
  want to access to most recent Mart created with this Definition; or, a
  positive integer that serves as a reverse index into the list of Marts
  created with this Definition, where 1 is the most recent Mart, 2 is the next
  most recent, and so on.

/definition/{definition_id}/{latest_or_index}/_api
--------------------------------------------------

A GET will retrieve details about the specified Mart.

A PUT will allow you to update properties of the specified Mart. The PUT body
allows an object with one parameter:

* pinned: Indicates whether or not the specified Mart should be marked as
  "pinned".

A DELETE will purge the specified Mart from the system.

The "specified Mart" is selected following the same rules as the
``/definition/{definition_id}/{latest_or_index}`` endpoint.

/mart
-----

A GET will retrieve a collection listing all Marts the calling user has access
to.

/mart/{mart_id}
---------------

An HTSQL endpoint that is connected to the specified Mart.

/mart/{mart_id}/_api
--------------------

A GET will retrieve details about the specified Mart.

A PUT will allow you to update properties of the specified Mart. The PUT body
allows an object with one parameter:

* pinned: Indicates whether or not the specified Mart should be marked as
  "pinned".

A DELETE will purge the specified Mart from the system.


Customization
=============

Some of the behavior of the ``rex.mart`` package can be altered by implementing
the ``rex.core`` Extensions it exposes.

MartQuota
    By implementing this Extension, you can alter how ``rex.mart`` checks the
    Quota rules for the system, and how/if it automatically purges Marts from
    the system in order to satisfy the Quota.

MartAccessPermissions
    By implementing this Extension, you can alter the permissioning behavior
    of ``rex.mart``. This allows you to change the rules that define what Marts
    and/or Mart Definitions can be accessed by users of the application.

Processor
    By implementing this Extension, you can create a new Post-Processor that
    can be invoked by Mart Definitions.

Read the API documentation for more information on the methods that can be
overridden.


Built-In Post-Processors
========================

datadictionary
--------------
The ``datadictionary`` Processor will generate a set of tables that includes
metadata about the tables and columns that were created in the Mart. Note that
for Assessment tables, the "title" of columns will contain the original RIOS
Instrument field name if it was not the same as the column name that was used,
and the "description" of columns will contain the text of the corresponding
Question configuration in the Form and/or Interaction, if one exists.

This Processor accepts the following options:

``table_name_tables``
    The name of the table that will contain metadata records about Mart tables.
    Defaults to ``datadictionary_table``.

``table_name_columns``
    The name of the table that will contain metadata records about Mart
    columns. Defaults to ``datadictionary_column``.

``table_name_enumerations``
    The name of the table that will contain metadata records about enumeration
    values used in this Mart. Defaults to ``datadictionary_enumeration``.

``table_descriptions``
    A CSV-formatted string that contains table metadata that will override the
    automatically-discovered metadata. Expects input like::

        name,title,description
        mytable,My Table,A table containing things
        othertable,,My Description

``column_descriptions``
    A CSV-formatted string that contains column metadata that will override the
    automatically-discovered metadata. Expects input like::

        table,name,title,description,source,datatype
        mytable,mycolumn,My Column,A column for stuff,Special Database,text
        othertable,othercol,,Primary column for flags,Nowhere,

index
-----
The ``index`` Processor will create the specified indexes in the Mart database.

This Processor accepts the following options:

``indexes``
    This is a list of index definitions, where each definition is a mapping
    that accepts the following properties:

    ``table``
        The name of the table to apply the index to. This property is required.

    ``columns``
        A list of the column(s) and/or expressions on the table to apply the
        index to. Expressions must be enclosed in parentheses. This property
        is required.

    ``unique``
        A boolean indicating whether or not to enforce uniqueness on the values
        in the index. Defaults to ``false``.

    ``partial``
        This property contains the predicate of the WHERE clause to use if you
        want the index to be partial. Defaults to ``null`` (meaning that the
        index will NOT be partial). See the `PostgreSQL documentation`_ for
        more information about partial indexes.

        .. _`PostgreSQL documentation`: http://www.postgresql.org/docs/current/static/sql-createindex.html

Please note that the table and column names that are specified in these index
definitions must be the actual names of the objects in the PostgreSQL database,
rather than the HTSQL-imposed labels that they may have.

analyze
-------
The ``analyze`` Processor will invoke the PostgreSQL ANALYZE operation to
collect statistics about the contents of tables in the Mart. This will help
PostgreSQL execute more efficient queries in databases with lots of data.


Built-In Definers
=================

rexdb
-----
The ``rexdb`` Definer retrieves its configuration from tables stored in the
main RexDB application database.


Known Issues
============

As this tool is still under development, it is likely that bugs or other
deficiencies will be encountered. At present, there are two known issues:

* The explanation and annotation fields in RIOS Assessments are not currently
  being transferred into Mart databases.
* If there is an enumerationSet field ID defined in a RIOS Instrument that,
  when concatenated with one or more of its enumeration IDs results in a field
  name that is too long for PostgreSQL to handle (typically 63 characters), it
  will crash the building of the Mart.

