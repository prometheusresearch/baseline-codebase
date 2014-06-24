********************************
REX.INSTRUMENT Programming Guide
********************************

.. contents:: Table of Contents


Overview
========

This package is responsible for two areas of functionality:

* Defining a basic set of class interfaces for building applications that
  make use of Electronic Data Capture (EDC) functionality such as Instruments
  and Assessments.
* Providing the functionality to validate and construct Common Instrument
  Definition and Common Assessment Document structures.

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

``rex.instrument`` defines abstract classes for the following objects that make
up the core functionality of an EDC application on the RexDB platform. For more
details on any particular class, please read the API Reference documentation.

User
    This class represents the actual user who is interacting with the EDC
    application.

Subject
    This class represents the target of the Instrument/InstrumentVersion. It is
    the entity (person, place, thing, etc) that the data points defined in the
    Instrument/InstrumentVersion are being gathered about.

Instrument
    This class represents an Instrument. An Instrument is what defines the data
    points that should be collected about a Subject. Instruments are made up of
    one or more InstrumentVersions that contain the exact specifications of the
    data points as the Instrument evolves over time.

InstrumentVersion
    This class represents a specific version of an Instrument. It contains the
    Common Instrument Definition for the Instrument at a particular point in
    the Instrument's lifetime.

Assessment
    This class represents the data that has been collected to satisfy an
    InstrumentVersion.


Format Validation
=================

This package also provides the means to validate the JSON-encoded Common
Instrument Definition and Common Assessment Document structures that are used
as part of the EDC applications.

To validate that an instrument definition complies with the Common Instrument
Definition standard, you can use the 
``InstrumentVersion.validate_definition()`` method. To validate that assessment
data complies with the Common Assessment Document standard, you can use the
``Assessment.validate_data()`` method.


Settings
========

``rex.instrument`` provides the following settings:

``instrument_implementation``
    This setting is a record that allows applications to indicate which
    implementations of the ``rex.instrument`` class interfaces to use in their
    operation.

    This setting allows the following keys:

    * user
    * subject
    * instrument
    * instrumentversion
    * assessment

    When a key is not specified, ``rex.instrument`` will use the ``top()``-most
    implementation that exists in the application instance.

