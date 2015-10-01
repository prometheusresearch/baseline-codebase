****************************
REX.MOBILE Programming Guide
****************************

.. contents:: Table of Contents


Overview
========

This package is responsible for two areas of functionality:

* Defining a basic set of class interfaces for building applications that make
  use of sms-based Electronic Data Capture (EDC) Interactions
  functionality.
* Extending the implementation of the `RIOS`_ specification and model in the
  RexDB platform.

.. _`RIOS`: https://rios.readthedocs.org

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Interface Classes
=================

``rex.mobile`` defines abstract classes for the following objects that make up
the core functionality of an SMS-based Interaction application on the RexDB
platform. For more details on any particular class, please read the API
reference documentation.

Interaction
    This class represents an augmentation of an InstrumentVersion (from
    ``rex.instrument``) that defines the presentation and behavior of the data
    capture interface in an SMS context.


Settings
========

``rex.mobile`` provides the following settings:

``mobile_implementation``
    This setting is a record that allows applications to indicate which
    implementations of the ``rex.mobile`` class interfaces to use in their
    operation.

    This setting allows the following keys:

    * interaction

    When a key is not specified, ``rex.mobile`` will use the ``top()``-most
    implementation that exists in the application instance.

``mobile_validate_on_startup``
    This setting governs whether or not the system will automatically validate
    all Interaction configurations found in the datastore upon server startup.
    If not specified, it defaults to ``True``.


Command Line Tools
==================

This package contains a series of command line tools (exposed via ``rex.ctl``):


mobile-retrieve
---------------

This tool will retrieve an SMS Interaction Configuration from the datastore and
print it to standard out. You can use the ``--output`` option to send the
output to a file. The ``instrument-uid`` parameter is the Unique ID (UID) of
the Instrument the desired Interaction is associated with, and ``channel-uid``
is the UID of the Channel the desired Interaction is associated with. By
default, it will retrieve the Interaction for the latest version of the
Instrument, unless the ``--version`` option is used.

This tool requires that an implementation of the ``rex.mobile`` interfaces
be installed and referenced by the project or ``rex.yaml``.

::

    rex mobile-retrieve <instrument-uid> <channel-uid> [<project>]


mobile-store
------------

This tool will store an SMS Interaction Configuration file to the datastore.
The ``instrument-uid`` parameter is the UID of the Instrument to associate the
Interaction with, and the ``channel-uid`` parameter is the UID of the Channel
to associate the / with. The ``configuration`` parameter is the path to a file
containing the SMS Interaction Configuration to store. By default, the
configuration will be associated with the latest version of the Instrument,
unless the ``--version`` option is used.

This tool requires that an implementation of the ``rex.mobile`` interfaces
be installed and referenced by the project or ``rex.yaml``.

::

    rex mobile-store <instrument-uid> <channel-uid> <configuration> [<project>]


mobile-validate
---------------

This tool will validate the structure of a configuration file against the rules
and schema of the SMS Interaction Configuration format. The ``configuration``
argument is the path to the file to validate. By default, the file will only be
validated against the base schema. If you want to also validate it against a
Common Instrument Definition, then you can use the ``--instrument`` parameter
to point this tool at the file containing the definition.

::

    rex mobile-validate <configuration>


mobile-format
-------------

This tool will (re)format a configuration according to the options you give it.
You can specify to output in either JSON or YAML, and whether or not the output
should be "prettified". The ``configuration`` argument is the path to the file
to format.

::

    rex mobile-format <configuration>


instrument-mobileskeleton
-------------------------

This tool will generate a basic Interaction configuration based on an existing
Instrument definition. The ``definition`` argument is the path to the file
containing the Instrument definition.

::

    rex instrument-mobileskeleton <definition>


mobile-form-convert
-------------------

This tool will generate a base Web Form Configuration based on an existing
Interaction configuration. The ``configuration`` argument is the path to the
file containing the SMS Interaction Configuration. (Note: This tool will only
be availabel if the ``rex.forms`` package is also installed in the same
application instance)

::

    rex mobile-form-convert <configuration>

