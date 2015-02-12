****************************
Common Instrument Definition
****************************

DRAFT v0.7.0


.. contents:: Table of Contents


Overview
========
The Common Instrument Definition format is a standard means to represent a set
of data points that must be collected about a subject.


Format
======
Instrument Definitions are created as `JSON`_ (JavaScript Object Notation)
objects. These objects adhere to the `JSON Schema`_ specification that is
described in this document.

.. _`JSON`: http://json.org/
.. _`JSON Schema`: http://json-schema.org/


Structure
=========

Root Object
-----------
The Root Object of an Instrument Definition consists of several properties:

id
    :Type: String
    :Constraints: Required; Must be a URI as described in `RFC3986`_
    :Description: This property contains a URI string that uniquely identifies
                  the instrument described within the definition. This ``id``, in
                  conjunction with the ``version`` property, is used by Assessment
                  Documents (and/or other supplementary documents) to identify
                  which Instrument Definition they correspond to. It is
                  recommended that this URI be an HTTP URL that, when accessed,
                  returns this Instrument Definition, but this is not required.

                  .. _`RFC3986`: http://tools.ietf.org/html/rfc3986
    :Example: http://example.com/myinstrument

version
    :Type: String
    :Constraints: Required; Must be formatted in a traditional <major>.<minor>
                  software versioning scheme
    :Description: This property contains a string that uniquely identifies a
                  published revision of this Instrument Definition. This
                  ``version``, in conjunction with the ``id`` property, is used by
                  Assessment Documents (and/or other supplementary documents)
                  to identify which Instrument Definition they correspond to.
                  The ``major`` portion of the version string should represent
                  a generation of the Instrument, whereas the ``minor`` portion
                  of the version string should represent a backwards-compatible
                  update to the Instrument.
    :Example: 1.2

title
    :Type: String
    :Constraints: Required
    :Description: This property contains a short string that acts as a
                  human-readable title or brief description of the Instrument
                  described within.
    :Example: My Example Title

description
    :Type: String
    :Description: This property allows the Instrument author to explain what
                  the Instrument is, what it's being used for, or any other
                  helpful information about the Instrument. This property is
                  optional.

types
    :Type: `Type Collection Object`_
    :Description: This property allows the Instrument author to define common
                  data types/restrictions that that are used throughout the
                  Instrument. This property is optional.

record
    :Type: Array of `Field Object`_
    :Description: This property contains all data points that this Instrument
                  is looking to collect responses for.


Field Object
------------
Field Objects are the core of what makes up an Instrument Definition. They
describe the data points the Instrument wants to collect. These objects consist
of several properties:

id
    :Type: String
    :Constraints: Required; Must be an `Identifier String`_
    :Description: This property uniquely identifies the data point so that it
                  can be referred to in subsequent documents.

description
    :Type: String
    :Description: This property allows the Instrument author to explain what
                  the Field is, what it's being used for, or any other
                  helpful information about the Field. This property is
                  optional.

type
    :Type: Enumerated String or `Type Object`_
    :Constraints: Required
    :Description: This property identifies the type of data that will be
                  returned as a response to this Field. It can be specified by
                  either indicating the identifier of one of the `Base Types`_,
                  the indentifier of one of the Types defined in the `Type
                  Collection Object`_, or it can be a `Type Object`_ that
                  defines a Type directly within this Field.

required
    :Type: Boolean
    :Description: Indicates whether or not a response is required for this
                  Field. This property is optional, and, if not specified,
                  is assumed to be false.

annotation
    :Type: Enumerated String
    :Description: Indicates whether or not this Field allows for an
                  additional text-based response that allows the respondent to
                  explain why they can't or won't answer this Field. This
                  property is optional, and, if not specified, is assumed to be
                  ``none``. If this Field is marked as required, this property
                  cannot be any value other than ``none``.
    :PossibleValues: * ``required`` - An annotation must be collected for this
                       Field.
                     * ``optional`` - An annotation may be collected for this
                       Field.
                     * ``none`` - An annotation is not allowed for this
                       Field.

explanation
    :Type: Enumerated String
    :Description: Indicates whether or not this Field allows for an
                  additional text-based response that allows the respondent to
                  provide more detail or to further explain the main response
                  to this Field. This property is optional, and, if not
                  specified, is assumed to be ``none``.
    :PossibleValues: * ``required`` - An explanation must be collected for this
                       Field.
                     * ``optional`` - An explanation may be collected for this
                       Field.
                     * ``none`` - An explanation is not allowed for this
                       Field.

identifiable
    :Type: Boolean
    :Description: Indicates whether or not the reponse for this Field will (or
                  can) contain information that can be used to identify the
                  subject or respondant. This is typically used to flag fields
                  that would contain information that could be classified as
                  "Protected Health Information" (`HIPAA PHI`_), "Personally
                  Identifiable Information" (`NIST PII`_), "Personal Data"
                  (`EU Data Protection Directive`_), etc. This property is
                  optional, and, if not specified, is assumed to be false. If a
                  ``recordList`` or ``matrix`` field is marked as
                  ``identifiable``, then that means that all sub-fields are
                  considered to be ``identifiable``.

.. _`HIPAA PHI`: http://www.gpo.gov/fdsys/pkg/CFR-2002-title45-vol1/pdf/CFR-2002-title45-vol1-sec164-514.pdf
.. _`NIST PII`: http://csrc.nist.gov/publications/nistpubs/800-122/sp800-122.pdf
.. _`EU Data Protection Directive`: http://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:31995L0046


Type Collection Object
----------------------
A Type Collection Object gives the Instrument author a means to define a set of
common and/or frequently-used data types/restrictions that can then be referred
to throughout the rest of the Instrument Definition. This object consists of
one or more properties where the property name serves as a unique identifier
for the Type, and the value of the property is the definition of the Type, in
the format of a `Type Object`_.

This identifier is a string that adheres to the following restrictions:

* Consists of one or more of the following characters

  * Lowercase latin alphabetic characters ("a" through "z"; Unicode 0061
    through 007A)
  * Uppercase latin alphabetic characters ("A" through "Z"; Unicode 0041
    through 005A)

* Cannot be the identifier of one of the `Base Types`_


Type Object
-----------
A Type Object defines a data Type that will be used to specify the type of data
that may be returned as a response to a Field. Not only does it specify the
base data type (e.g., ``text`` vs ``integer`` vs ``date``), but it also allows the
author to place additional restrictions or constraints on the data.

base
    :Type: Enumerated String
    :Constraints: Required
    :Description: This property indicates the base Type that this Type Object
                  will inherit its basic properties from. All Types defined in
                  an Instrument Definition must inherit from either one of the
                  **simple** `Base Types`_, or one of the Types defined in the
                  `Type Collection Object`_.

range
    :Type: `Bound Constraint Object`_
    :Constraints: The ``min`` and ``max`` properties, if specified, must be of the
                  same data type as the ``base`` Type this constraint is applied
                  to.
    :SupportedBaseTypes: integer, float, date, time, dateTime
    :Description: This property allows the definition author to set the minimum
                  and/or maximum limits (inclusive) that a valid response would
                  be bound by.

length
    :Type: `Bound Constraint Object`_
    :Constraints: The ``min`` and ``max`` properties, if specified, must be
                  integers.
    :SupportedBaseTypes: text, enumerationSet, recordList
    :Description: For ``text`` response types, this property allows the
                  definition author to set the minimum and/or maximum character
                  length that the response can be. For ``enumerationSet``
                  response types, this property allows the definition author to
                  specify the minimum and/or maximum number of enumerations the
                  respondent can select. For ``recordList`` response
                  types, this property allows the definition author to specify
                  the minimum and/or maximum number of response sets the
                  respondent can provide for this Field. If this Field is
                  also marked as required, then the minimum value cannot be
                  lower than one.

pattern
    :Type: String
    :Constraints: Must be a Regular Expression as defined by `ECMA 262`_

                  .. _`ECMA 262`: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
    :SupportedBaseTypes: text
    :Description: This property specifies a regular expression that the
                  response text must match in order to be considered a valid
                  response.
    :Example: ^[A-Z0-9]$

enumerations
    :Type: `Enumeration Collection Object`_
    :Constraints: Required for ``enumeration`` and ``enumerationSet`` Types
    :SupportedBaseTypes: enumeration, enumerationSet
    :Description: This property specifies the set of values that respondents
                  are allowed to choose from.

record
    :Type: Array of `Field Object`_
    :Constraints: Required for ``recordList`` Types
    :SupportedBaseTypes: recordList
    :Description: This property specifies the Record that respondents must
                  respond to as a repeating set.

columns
    :Type: Array of `Column Object`_
    :Constraints: Required for ``matrix`` Types
    :SupportedBaseTypes: matrix
    :Description: This property specifies the columns that make up a matrix
                  data point.

rows
    :Type: Array of `Row Object`_
    :Constraints: Required for ``matrix`` Types
    :SupportedBaseTypes: matrix
    :Description: This property specifies the rows that make up a matrix data
                  point.


Column Object
-------------
Column Objects are to Matrices as Field are to Instruments; they define the
data points that are to be collected for reach row.

id
    :Type: String
    :Constraints: Required; Must be an `Identifier String`_
    :Description: This property uniquely identifies the data point so that it
                  can be referred to in subsequent documents.

description
    :Type: String
    :Description: This property allows the Instrument author to explain what
                  the Column is, what it's being used for, or any other
                  helpful information about the Column. This property is
                  optional.

type
    :Type: Enumerated String or `Type Object`_
    :Constraints: Required
    :Description: This property identifies the type of data that will be
                  returned as a response to this Coumn. It can be specified by
                  either indicating the identifier of one of the simple `Base
                  Types`_, the indentifier of one of the Types defined in the
                  `Type Collection Object`_, or it can be a `Type Object`_ that
                  defines a simple Type directly within this Field.

required
    :Type: Boolean
    :Description: Indicates whether or not a response is required for this
                  Column. This property is optional, and, if not specified,
                  is assumed to be false.

identifiable
    :Type: Boolean
    :Description: Indicates whether or not the reponse for this Field will (or
                  can) contain information that can be used to identify the
                  subject or respondant. This is typically used to flag fields
                  that would contain information that could be classified as
                  "Protected Health Information" (`HIPAA PHI`_), "Personally
                  Identifiable Information" (`NIST PII`_), "Personal Data"
                  (`EU Data Protection Directive`_), etc. This property is
                  optional, and, if not specified, is assumed to be false.


Row Object
----------
Row Objects designate the named rows that are listed in a Matrix-typed field.

id
    :Type: String
    :Constraints: Required; Must be an `Identifier String`_
    :Description: This property uniquely identifies the data point so that it
                  can be referred to in subsequent documents.

description
    :Type: String
    :Description: This property allows the Instrument author to explain what
                  the Row is, what it's being used for, or any other
                  helpful information about the Row. This property is
                  optional.

required
    :Type: Boolean
    :Description: Indicates whether or not a response is required for this
                  Row. This property is optional, and, if not specified,
                  is assumed to be false.


Base Types
----------
The following Types are considered part of the basic functionality provided by
Instrument Definitions and can be used when specifiying the type of a Field, or
when specifying a ``base`` when defining a new type in a `Type Object`_.

=============== ======= ===========
Identifier      Class   Description
=============== ======= ===========
float           simple  A floating-point numeric value.
integer         simple  An integer value.
text            simple  A string value.
enumeration     simple  A string value that must be chosen from a predefined set of
                        values.
enumerationSet  simple  An array of one or more string values that must be chosen from
                        a predefined set of values.
boolean         simple  Either a true or false value.
date            simple  A string value representing a date in time. Must be formatted
                        as an `ISO 8601`_ extended format calendar date (YYYY-MM-DD).
time            simple  A string value representing a time of day. Must be formatted as
                        an `ISO 8601`_ extended format time (HH:MM:SS).
dateTime        simple  A string value representing the time on a specific date. Must
                        be formatted as an `ISO 8601`_ extended format date and time
                        combination (YYYY-MM-DDTHH:MM:SS).
recordList      complex An array of multiple-response collections, where each element
                        in the array is the same set of Fields being responded to
                        multiple times.
matrix          complex A multi-value grid that presents the same Fields (columns) for
                        every record (row).
=============== ======= ===========

.. _`ISO 8601`: http://en.wikipedia.org/wiki/ISO_8601


Bound Constraint Object
-----------------------
A Bound Constraint Object is a generic structure that allows the definition
author to place explicit upper and/or lower bounds on the response of a
particular Field. These objects consist of at least one of the following
properties:

min
    :Type: Dependent on context
    :Description: This property specifies the lower bound of the constraint.
                  This bound is inclusive, meaning that the value specified in
                  this property is also considered a valid response. This
                  property is optional, and, if not specified, is assumed to
                  represent the fact that there is no lower bound other than
                  that which makes contextual sense based on the data type and
                  constraint involved.

max
    :Type: Dependent on context
    :Description: This property specifies the upper bound of the constraint.
                  This bound is inclusive, meaning that the value specified in
                  this property is also considered a valid response. This
                  property is optional, and, if not specified, is assumed to
                  represent the fact that there is no lower bound other than
                  that which makes contextual sense based on the data type and
                  constraint involved.


Enumeration Collection Object
-----------------------------
An Enumeration Collection Object consists of one or more properties where the
property name serves as a unique identifier for the enumeration, and the
value of the property is the definition of the enumeration, in the format of a
`Enumeration Object`_ (or null).

This identifier is a string that adheres to the following restrictions:

* Consists of 1 or more of the following characters:

  * Lowercase latin alphabetic characters ("a" through "z"; Unicode 0061
    through 007A)
  * Latin numeric digits ("0" through "9"; Unicode 0030 through 0039)
  * Underscore characters ("_"; Unicode 005F)
  * Hyphen characters ("-"; Unicode 002D)

* The last character is a lowercase latin alphabetic character or latin numeric
  digit.
* Does not contain consecutive underscore and/or hyphen characters.

The unique identifiers for these enumerations are used by Assessment Documents
(and/or other supplementary documents) to indicate which enumeration(s) were
selected by the respondent.

Example Unique Identifiers:

* blue_green
* abc123
* ref-1-2-alpha
* 42
* a


Enumeration Object
------------------
An Enumeration Object represents one possible response a respondent has
available to them in the context of a Field that is of the type ``enumeration``
or ``enumerationSet``. These object consist of the following properties:

description
    :Type: String
    :Description: This property allows the Instrument author to explain what
                  the Enumeration is, what it's being used for, or any other
                  helpful information about the Enumeration. This property is
                  optional.


Identifier String
-----------------
An Identifier String is a token that is used to uniquely identify a specific
structure. The identifier must be unique throughout the *entire* context of the
Instrument Definition. This identifier is a string that adheres to the
following restrictions:

* Consists of 2 or more of the following characters:

  * Lowercase latin alphabetic characters ("a" through "z"; Unicode 0061
    through 007A)
  * Latin numeric digits ("0" through "9"; Unicode 0030 through 0039)
  * Underscore characters ("_"; Unicode 005F)
  * Hyphen characters ("-"; Unicode 002D)

* The first character is a lowercase latin alphabetic character.
* The last character is a lowercase latin alphabetic character or latin numeric
  digit.
* Does not contain consecutive underscore and/or hyphen characters.

The unique identifiers for these Fields are used by Assessment Documents
(and/or other supplementary documents) to associate responses or other
configuration to the Fields defined by the Instrument.

Example Identifier Strings:

* q_eye_color
* abc123
* ref-1-2-alpha


JSON Schema 
===========

.. literalinclude:: common_instrument_definition.json
   :language: javascript

