**************************
Common Assessment Document
**************************

DRAFT v0.4.0


.. contents:: Table of Contents


Overview
========
The Common Assessment Document format is a standard means to represent a set of
values for the Fields specified by a Common Instrument Definition.


Format
======
Assessment Documents are created as `JSON`_ (JavaScript Object Notation)
objects. These objects adhere to the `JSON Schema`_ specification that is
described in this document.

.. _`JSON`: http://json.org/
.. _`JSON Schema`: http://json-schema.org/


Structure
=========

Root Object
-----------
The Root Object of an Assessment Document consists of several properties:

instrument
    :Type: `Instrument Reference Object`_
    :Constraints: Required
    :Description: This property specifies which Instrument Definition the
                  values contained within this Assessment Document
                  correspond to.

meta
    :Type: `Metadata Collection Object`_
    :Description: This property allows arbitrary information about the
                  Assessment to be stored within the document. This property is
                  optional.

values
    :Type: `Value Collection Object`_
    :Constraints: Required
    :Description: This property contains the values for the Fields defined
                  in the associated Instrument Definition.


Instrument Reference Object
---------------------------
An Instrument Reference Object is the means for an Assessment Document to
reference the exact Instrument (and version of that Instrument) that the
values contained within are in reference to.

id
    :Type: String
    :Constraints: Required; Must be a URI as described in `RFC3986`_

                  .. _`RFC3986`: http://tools.ietf.org/html/rfc3986
    :Description: This property is a reference to the `id` property on the root
                  object of an Instrument Definition. It is meant to specify the
                  exact Instrument this Assessment Document is in response to.

version
    :Type: String
    :Constraints: Required
    :Description: This property is a reference the the `version` property on the
                  root object of an Instrument Definition. It is meant to
                  specify the exact revision of the Instrument this Assessment
                  Document is in response to.


Value Collection Object
-----------------------
A Value Collection Object consists of one to many properties where the
property name serves as a reference to the ID of a Field defined in the
associated Instrument, and the value of that property is a `Value Object`_
which contains the actual value for the Field.

This object must contain a property for *every* Field Object defined in the
corresponding Field Collection Object in the Instrument Definition.


Value Object
------------
A Value Object contains a value for a Field on an Instrument.

value
    :Constraints: Required
    :Description: This property contains the main value for the Field. If
                  there is no value for the Field, the value for this
                  property should be null. This non-response indication should
                  be used for all data types (e.g., don’t use an empty string
                  for `text` data types, or empty arrays for `enumerationSet`
                  or `recordList` data types).
    :Type: Dependent on the type defined by the corresponding Field Object
           in the Instrument Definition. See following table:

           ==================  ===================  ===========
           Field Data Type     JSON Data Type       Constraints
           ==================  ===================  ===========
           integer             Number               Must be an integer (no decimal points or fractional numbers)
           float               Number
           text                String
           boolean             Boolean
           date                String               Must be an `ISO 8601`_ extended format calendar date (YYYY-MM-DD)
           time                String               Must be an `ISO 8601`_ extended format time (HH:MM:SS)
           dateTime            String               Must be an `ISO 8601`_ extended format date and time combination (YYYY-MM-DDTHH:MM:SS)
           enumeration         String
           enumerationSet      Array of Strings
           recordList          Array of `Value
                               Collection Object`_
           matrix              `Value Collection
                               Mapping`_
           ==================  ===================  ===========

           .. _`ISO 8601`: http://en.wikipedia.org/wiki/ISO_8601

explanation
    :Type: String
    :Description: This property contains the additional explanation text for a
                  response, if any was provided.

annotation
    :Type: String
    :Description: This property contains the additional annotation text for a
                  response, if any was provided.

meta
    :Type: `Metadata Collection Object`_
    :Description: This property allows arbitrary information about the
                  value to be stored within the document. This property is
                  optional.


Value Collection Mapping
------------------------
A Value Collection Mapping consists of one to many properties where the
property name serves as a reference to the ID of a Row Object defined in the
associated Matrix Field, and the value of that property is a `Value Collection
Object`_ which contains the value(s) for the associated Column Objects.

This object must contain a property for *every* Row Object defined in the
corresponding Matrix Field Object in the Instrument Definition. The embedded
Value Collection Objects must contain a property for *every* Column Object from
the corresponding Matrix Field Object.


Metadata Collection Object
--------------------------
A Metadata Collection Object consists of one to many properties that allows you
to attach arbitrary, implementation-specific, or other such data to structures
within an Assessment Document.

For consistency's and interoperability's sake, some common data elements are
defined below, but note that the Metadata Collection Object has no required or
pre-defined properties, and can therefore contain any (legal JSON) property
names and value data types. Software that consumes Assessment Documents *must*
ignore any property whose name it does not recognize or support.

=============== =================== =========== =================== =============================================================
Property Name   Document Scope      Data Type   Example             Description
=============== =================== =========== =================== =============================================================
language        Assessment          String      en                  A Language Tag (as described in `RFC5646`_) that indicates
                                                                    the language/locale used in the values of the Assessment.
application     Assessment          String      SurveyMaster/1.0    A string that indicates what application produced the
                                                                    Assessment Document. This string should be formatted
                                                                    similarly to HTTP User-Agent strings as specified in
                                                                    `RFC2616`_.
dateCompleted   Assessment          String      2012-11-20T10:46:08 An `ISO 8601`_ extended format date and time combination that
                                                                    indicates when data collection for the Assessment completed.
timeTaken       Assessment, Value   Number      23                  An integer that indicates the number of seconds that
                                                                    completion of the scoped object took. E.g., it took 23
                                                                    seconds for the respondant to provide the value for a
                                                                    particular Field.
=============== =================== =========== =================== =============================================================

.. _`RFC5646`: http://tools.ietf.org/html/rfc5646
.. _`RFC2616`: http://tools.ietf.org/html/rfc2616#section-14.43


JSON Schema 
===========

.. literalinclude:: common_assessment_document.json
   :language: javascript

