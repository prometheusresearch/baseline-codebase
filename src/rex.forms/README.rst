***************************
REX.FORMS Programming Guide
***************************

.. contents:: Table of Contents


Overview
========

This package is responsible for three areas of functionality:

* Defining a basic set of class interfaces for building applications that
  make use of web-based Electronic Data Capture (EDC) Forms functionality.
* Extending the implementation of the `RIOS`_ specification and model in the
  RexDB platform.
* Providing a JavaScript library for rendering and orchestrating the Forms
  defined by this package within a web page.

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

``rex.forms`` defines abstract classes for the following objects that make up
the core functionality of a web-based EDC Form applicaiton on the RexDB
platform. For more details on any particular class, please read the API
reference documentation.

Form
    This class represents an augmentation of an InstrumentVersion (from
    ``rex.instrument``) that defines the presentation and behavior of the
    data capture interface on the web.

DraftForm
    This class represents a version of a Form that is in the process of being
    created. It is not available for use by the system to collect data until it
    is published.


Settings
========

``rex.forms`` provides the following settings:

``forms_implementation``
    This setting is a record that allows application to indicate which
    implementations of the ``rex.forms`` class interfaces to use in their
    operation.

    This setting allows the following keys:

    * form
    * draftform

    When a key is not specified, ``rex.forms`` will use the ``top()``-most
    implementation that exists in the application instance.

``forms_validate_on_startup``
    This setting governs whether or not the system will automatically validate
    all Form configurations found in the datastore upon server startup. If not
    specified, it defaults to ``True``.

``forms_local_resource_prefix``
    This setting contains a URL prefix that will be automatically applied to
    all resources referenced by Form configurations (e.g., Audio files) that
    start with a ``/``. If not specified, it defaults to ``None``.

``forms_presentation_adaptors``
    This setting is a mapping of channel IDs to lists of PresentationAdaptor
    names. It allows you to specify which PresentationAdaptors to apply to the
    Channels in the system. If not specified, it contains no mappings.


Command Line Tools
==================

This package contains a series of command line tools (exposed via ``rex.ctl``):


forms-retrieve
--------------

This tool will retrieve a Web Form Configuration from the datastore and
print it to standard out. You can use the ``--output`` option to send the
output to a file. The ``instrument-uid`` parameter is the Unique ID (UID) of
the Instrument the desired Form is associated with, and ``channel-uid`` is the
UID of the Channel the desired Form is associated with. By default, it will
retrieve the Form for the latest version of the Instrument, unless the
``--version`` option is used.

This tool requires that an implementation of the ``rex.forms`` interfaces
be installed and referenced by the project or ``rex.yaml``.

::

    rex forms-retrieve <instrument-uid> <channel-uid> [<project>]


forms-store
-----------

This tool will store a Web Form Configuration file to the datastore. The
``instrument-uid`` parameter is the UID of the Instrument to associate the Form
with, and the ``channel-uid`` parameter is the UID of the Channel to associate
the Form with. The ``configuration`` parameter is the path to a file
containing the Web Form Configuration to store. By default, the configuration
will be associated with the latest version of the Instrument, unless the
``--version`` option is used.

This tool requires that an implementation of the ``rex.forms`` interfaces
be installed and referenced by the project or ``rex.yaml``.

::

    rex forms-store <instrument-uid> <channel-uid> <configuration> [<project>]


forms-validate
--------------

This tool will validate the structure of a configuration file against the rules
and schema of the Web Form Configuration format. The ``configuration`` argument
is the path to the file to validate. By default, the file will only be
validated against the base schema. If you want to also validate it against a
Common Instrument Definition, then you can use the ``--instrument`` parameter
to point this tool at the file containing the definition.

::

    rex forms-validate <configuration>


forms-format
------------

This tool will (re)format a definition according to the optiosn you give it.
You can specify to output in either JSON or YAML, and whether or not the
output should be "prettified". The ``configuration`` argument is the path to
the file to format.

::

    rex forms-format <configuration>


instrument-formskeleton
-----------------------

This tool will generate a basic Form configuration based on an existing
Instrument definition. The ``definition`` argument is the path to the file
containing the Instrument definition.

::

    rex instrument-formskeleton <definition>


Custom RIOS Web Form Widgets
============================

This package includes implementations of custom widgets that go beyond those
defined by the `RIOS`_ Web Form Configuration specification.

lookupText
----------
This widget is for ``text`` questions. It allows the Form author to provide an
HTSQL query that will be used to display a dynamic lookup table that is
displayed to the end user to help them fill in the value for the field. As the
user types into the text box, their input will be fed to the query as a
variable that can be used to limit the displayed options to those that match
what they've typed in. When/If the user clicks on an option, the value
associated with that option will be placed into the text field.

This widget accepts two properties in its ``options``:

* ``query``: This property is required and must contain an HTSQL query that
  should be executed as the user types into the text box. This query must
  return two fields: one labelled ``label`` that contains the description of
  the value to display to the user, and one labelled ``value`` which contains
  the value that will be placed in the text box when/if the user clicks on it.
  This query will receive one variable, ``$search`` which contains the value
  the user has currently entered into the text box.
* ``width``: Like the ``inputText`` widget, this property defines the size of
  the text box. Allows ``small``, ``medium``, or ``large``. This property is
  optional, and if not specified, defaults to ``medium``.

**Note:** This widget does not restrict the user's input to those values
returned by the query. The user is allowed to enter any value that passes the
constraints defined by the Instrument. The automatic lookup functionality
provided by this widget is only meant to help the user find a good value to
enter -- not limit their values.

