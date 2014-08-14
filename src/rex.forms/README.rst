***************************
REX.FORMS Programming Guide
***************************

.. contents:: Table of Contents


Overview
========

This package is responsible for three areas of functionality:

* Defining a basic set of class interfaces for building applications that
  make use of web-based Electronic Data Capture (EDC) Forms functionality.
* Providing the functionality to validate and construct Web Form
  Configuration structures.
* Providing a JavaScript library for rendering and orchestrating the Forms
  defined by this package within a web page.

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

Channel
    This class represents an Electronic Data Capture application for which a
    Form can be configured.

Form
    This class represents an augmentation of an InstrumentVersion (from
    ``rex.instrument``) that defines the presentation and behavior of the
    data capture interface on the web.

Task
    This class represents a requirement or check-list item for a Subject (from
    ``rex.instrument``) that tells the system to prompt the User to complete
    the specified Form.

Entry
    This class represents a preliminary or historical version of an Assessment
    (from ``rex.instrument``) that is used in a multiple-data-entry application
    to capture the separate instances of the data prior to reconcilation, or is
    used to record the previous revisions of an Assessment if it is modified
    after completion.

DraftForm
    This class represents a version of a Form that is in the process of being
    created. It is not available for use by the system to collect data until it
    is published.


Format Validation
=================

This package also provides the means to validate the JSON-encoded Web Form
Configuration structures that are used as part of a web-based EDC application.

To validate that a form configuration complies with the Web Form Configuration
specification, you can use the ``Form.validate_configuration()`` method.


Settings
========

``rex.forms`` provides the following settings:

``forms_implementation``
    This setting is a record that allows application to indicate which
    implementations of the ``rex.forms`` class interfaces to use in their
    operation.

    This setting allows the following keys:

    * channel
    * form
    * task
    * entry
    * draftform

    When a key is not specified, ``rex.forms`` will use the ``top()``-most
    implementation that exists in the application instance.


JavaScript Components
=====================

Using Rex Forms inside application
----------------------------------

``rex.forms`` distirbutes bower package with JavaScript code inside it.

To get access to ``RexForms`` inside your application which uses CommonJS module
system, you should include it in you code bundle::

  var RexForms = require('rex-forms')

If you don't want or can't use CommonJS you can access ``RexForms`` via
``window.RexForms`` if you setup ``rex-forms`` bundle in your ``setup.py``::

  setup(
    ...,
    rex_bundle={
      './bundle.rexforms/': 'webpack:rex-forms'
    },
    ...
  )

Then you shoud add the following line in you HTML/template::

  <script src="/bundle.rexforms/bundle.js"></script>

And access all ``rex.forms`` functionality via ``window.Rex.Forms`` global.

API
---

``RexForms`` object provides a single function ``render(options)`` which renders
a form with given options::

    var form = RexForms.render({
      ...
    })

Possible options are:

``element``
  DOM element to render form into, form will be rendered as a first child of a
  provided DOM element.

``instrument``
  Instrument specifiction to use.

``form``
  Web form specification to use.

``assessment``
  Assessment document to use to populate form fields.

``parameters``
  Arbitrary form parameters.

``locale``
  Form local (default: ``"en"``).

``showOverviewOnCompletion``
  Show form overview before completing the form. This allows to get an overview
  of entered values and to edit them directly without returning to form entry
  interface. (default: ``true``)

``showOverview``
  Show form overview.

``readOnly``
  (Only applies when overview mode is active) Do not allow to edit values in
  overview mode.

``scrollToTopOnPage``
  Scroll at the top of the form on page transition. (default: ``true``)

To remove form from DOM call ``unmount()`` method::

  form.unmount()

Events API
----------

Form (object returned by ``RexForms.render()``) is an event emitter, you can
subscribe to events like::

  form.on(eventName, function(arg, ...) {

  })

where available events are:

``change(assessment, form)``
  Form assessment changed and is valid.

``update(assessment, isValid, form)``
  Form assessment updated

``complete(assessment, form)``
  Form assessment completed.

``page(page, pageIndex, form)``
  Page transition happened.


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
the Form with. The ``configuration`` parameter is the path to a JSON file
containing the Web Form Configuration to store. By default, the configuration
will be associated with the latest version of the Instrument, unless the
``--version`` option is used.

This tool requires that an implementation of the ``rex.forms`` interfaces
be installed and referenced by the project or ``rex.yaml``.

::

    rex forms-store <instrument-uid> <channel-uid> <configuration> [<project>]


forms-validate
-------------------

This tool will validate the structure of a JSON file against the rules and
schema of the Web Form Configuration format. The ``configuration`` argument
is the path to the JSON file to validate. By default, the file will only be
validated against the base schema. If you want to also validate it against a
Common Instrument Definition, then you can use the ``--instrument`` parameter
to point this tool at the file containing the definition.

::

    rex forms-validate <configuration>

