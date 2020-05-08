******************************
REX.INSTRUMENT_API Usage Guide
******************************

.. contents:: Table of Contents
   :depth: 2


Overview
========

This package provides a set of web service APIs that expose a limited set of
functions provided by the ``rex.instrument`` APIs for use by external systems.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Web Services
============

The following web service APIs are provided by this package.


Subject Creation
----------------
This API allows clients to create new Subjects in the datastore.

Properties
~~~~~~~~~~
Path:
    rex.instrument_api:/subject

HTTP Method:
    POST

Formats:
    JSON, YAML

Request
~~~~~~~
The request payload must be a mapping that allows the following keys:

mobile_tn
    The mobile telephone number of the Subject. Optional.

context
    A mapping that may contain subkeys that correspond to the implementation
    context parameters accepted by the Subject.create() method.

An example::

    {
      "mobile_tn": "+15555551234",
      "context": {
        "sex": "male"
      }
    }

Response
~~~~~~~~
The response payload is a mapping that contains the following keys:

subject
    The UID of the Subject that was created in the datastore.

An example::

    {
      "subject": "ABC123DEF"
    }


Instrument/InstrumentVersion Creation
-------------------------------------
This API allows clients to create new Instruments and InstrumentVersions in the
datastore.

Properties
~~~~~~~~~~
Path:
    rex.instrument_api:/instrumentversion

HTTP Method:
    POST

Formats:
    JSON, YAML

Request
~~~~~~~
The request payload must be a mapping that allows the following keys:

instrument
    The `RIOS`_ Instrument Definition that is to be loaded into the system.

calculationset
    The `RIOS`_ Calculation Set Definition that must be associated with the
    Instrument Definition. Optional. Calculations specifying Python callables
    are not allowed and will result in an error.

.. _`RIOS`: https://rios.readthedocs.org

context
    A mapping that may contain subkeys that correspond to the implementation
    context parameters accepted by the Instrument.create() and
    InstrumentVersion.create() methods.

An example::

    {
      "instrument": {
        "id": "urn:some-instrument",
        "version": "1.0",
        "title": "Some Instrument Definition",
        "record": [
          {
            "id": "first_field",
            "type": "integer",
            "required": True
          },
          {
            "id": "second_field",
            "type": "text"
          }
        ]
      },
      "calculationset": {
        "instrument": {
          "id": "urn:some-instrument",
          "version": "1.0"
        },
        "calculations": [
          {
            "id": "calculation1",
            "type": "integer",
            "method": "python",
            "options": {
              "expression": "assessment['first_field'] * 2"
            }
          },
          {
            "id": "calculation2",
            "type": "text",
            "method": "htsql",
            "options": {
              "expression": "upper($second_field)"
            }
          }
        ]
      },
      "context": {
        "some_parameter": "foo"
      }
    }

Response
~~~~~~~~
The response payload is a mapping that contains the following keys:

instrument_version
    The UID of the InstrumentVersion that was created in the datastore.

An example::

    {
      "instrument_version": "some-instrument.1"
    }


Assessment Creation
-------------------
This API allows clients to create new Assessments in the datastore. If there
are calculations defined for the corresponding InstrumentVersion, then the
results of those calculations will be returned.

Properties
~~~~~~~~~~
Path:
    rex.instrument_api:/assessment

HTTP Method:
    POST

Formats:
    JSON, YAML

Request
~~~~~~~
The request payload must be a mapping that allows the following keys:

subject
    The UID of the Subject in the datastore to associate the Assessment with.

instrument_version
    The UID of the InstrumentVersion in the datastore that this Assessment is
    in response to. Optional. If not specified, the API will attempt to
    identify the InstrumentVersion by using the instrument referenced in the
    assessment key.

assessment
    The `RIOS`_ Assessment Document that contains the data to store in the
    Assessment.

evaluation_date
    The date the data in the Assessment was collected. Optional.

context
    A mapping that may contain subkeys that correspond to the implementation
    context parameters accepted by the Assessment.create() method.

An example::

    {
      "subject": "ABC123DEF",
      "evaluation_date": "2015-06-26",
      "context": {
        "study": "study_id"
      },
      "assessment": {
        "instrument": {
          "id": "urn:some-instrument",
          "version": "1.0"
        },
        "values": {
          "first_field": {
            "value": 123
          },
          "second_field": {
            "value": "hello world"
          }
        }
      }
    }

Response
~~~~~~~~
The response payload is a mapping that contains the following keys:

assessment
    The UID of the Assessment that was created in the datastore.

calculations
    A mapping containing the results of the calculations that are defined for
    the InstrumentVersion that this Assessment was associated with. This key
    won't be present if no calculations are defined.

An example::

    {
      "assessment": "ABC123DEF.(some-instrument.1).1",
      "calculations": {
        "calculation1": 246,
        "calculation2": "HELLO WORLD"
      }
    }

