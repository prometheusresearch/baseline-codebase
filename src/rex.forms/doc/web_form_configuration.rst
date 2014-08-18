**********************
Web Form Configuration
**********************

DRAFT v0.4.0


.. contents:: Table of Contents


Overview
========
The Web Form Configuration format is a means to augment a Common Instrument
Definition with additional configuration and meta-data that allows RexDB
applications to generate user-facing forms that are used to collect data for
the Instrument.


Format
======
Web Form Configurations are created as `JSON`_ (JavaScript Object Notation)
objects. These objects adhere to the `JSON Schema`_ specification that is
described in this document.

.. _`JSON`: http://json.org/
.. _`JSON Schema`: http://json-schema.org/


Structure
=========

Root Object
-----------
The Root Object of a Web Form Configuration consists of several properties:

instrument
    :Type: `Instrument Reference Object`_
    :Constraints: Required
    :Description: This property specifies which Instrument Definition the Form
                  is based on.

defaultLocalization
    :Type: String; Must be in the form of a `RFC5646`_ Language Tag
    :Constraints: Required
    :Description: This property specifies the localization that will be
                  available in every `Localized String Object`_ within the Form
                  Configuration.

title
    :Type: `Localized String Object`_
    :Description: This property contains a short string that acts as a
                  human-readable title or brief description of the Form
                  described within.
    :Example: My Example Title

tags
    :Type: Array of `Identifier`_
    :Description: This property defines all tags that may be used throughout
                  the Form either in the ``tags`` property of Elements or the
                  ``targets`` property of Events.

pages
    :Type: Array of `Page Object`_
    :Contraints: Required; Must contain at least one `Page Object`_
    :Description: This property lists the Pages of Questions (and/or other
                  Elements) that the Form is made up of. The order that the
                  Pages are placed in this property is the same order that they
                  will be presented on the front end.

unprompted
    :Type: `Unprompted Collection Object`_
    :Description: This property contains information about how to handle all
                  Fields from the Instrument that are not included in any
                  Questions.

parameters
    :Type: `Parameter Collection Object`_
    :Description: This property specifies the identifiers of variables that
                  will be provided upon instantiation by a source external to
                  this Form.


Instrument Reference Object
---------------------------
An Instrument Reference Object is the means for a Web Form Configuration to
reference the exact Instrument (and version of that Instrument) that the
responses contained within are in reference to.

id
    :Type: String
    :Constraints: Required; Must be a URI as described in `RFC3986`_

                  .. _`RFC3986`: http://tools.ietf.org/html/rfc3986
    :Description: This property is a reference to the ``id`` property on the root
                  object of an Instrument Definition. It is meant to specify the
                  exact Instrument this Web Form Configuration is based on.

version
    :Type: String
    :Constraints: Required
    :Description: This property is a reference the the ``version`` property on the
                  root object of an Instrument Definition. It is meant to
                  specify the exact revision of the Instrument this Form
                  Configuration is based on.


Page Object
-----------
A Page object represents a all the Elements of a Form that will be shown on a
single screen. It consists of several properties:

id
    :Type: `Identifier`_
    :Constraints: Required
    :Description: This property specifies a unique identifier for the Page, so
                  that it can be referenced in the context of event trigger
                  expressions.

elements
    :Type: Array of `Element Object`_
    :Constraints: Required; Must contain at least one `Element Object`_
    :Description: This property contains the list of Elements (Questions, text
                  entries, dividers, etc) that the Page is made up of. The
                  order that the Elements are placed in this property is the
                  same order that they will be presented on the front end.


Element Object
--------------
An Element object represents a single piece of a Form. It consists of several
properties:

type
    :Type: Enumerated String
    :Constraints: Required
    :Description: This property indicates the type of element that is being
                  described.
    :PossibleValues: =========== ===========
                     Name        Description
                     =========== ===========
                     question    A Question that the user can respond to.
                     header      A header/title text entry. Analogous to an H1 HTML tag.
                     text        A paragraph or group of text that should be displayed to the user.
                     divider     A horizontal screen divider. Analogous to an HR HTML tag.
                     =========== ===========

options
    :Type: Object
    :Description: This property is a container for whatever additional
                  parameters are needed for this particular Element.
    :PossibleValues: =============== ==================
                     Element Type    Applicable Options
                     =============== ==================
                     question        The options are in the form of a `Question Object`_.
                     header          The only option allowed is a single property named ``text`` that
                                     is a `Localized String Object`_.
                     text            The only option allowed is a single property named ``text`` that
                                     is a `Localized String Object`_.
                     divider         N/A
                     =============== ==================

tags
    :Type: Array of `Identifier`_
    :Description: This property allows the Form author to tag the element as
                  belonging to a particular "group" so that they may be later
                  referenced in an `Event Object`_ target as collection. The
                  tags used in this property must have been defined in the
                  ``tags`` property on the `Root Object`_.


Question Object
---------------
A Question Object defines how a Field from an Instrument is presented to the
user so that they may provide a response.

fieldId
    :Type: String
    :Constraints: Required
    :Description: This property is a reference to the ID of a Field that is
                  defined in the associated Instrument Definition. A Field
                  ID can only be used in one Question Object in a given Form.

text
    :Type: `Localized String Object`_
    :Constraints: Required
    :Description: This property allows the Form author to provide a more
                  detailed description for the Question. Often, it is an
                  explicit question that is being asked of the Subject.
    :Example: What is the your age?

help
    :Type: `Localized String Object`_
    :Description: This property allows the Form author to supply additional
                  text that will be provided as help content for the Question.
                  This property is optional.

error
    :Type: `Localized String Object`_
    :Description: This property allows the Form author to supply text that will
                  be presented to the user when the value they've input is not
                  valid. This property is optional.

enumerations
    :Type: Array of `Descriptor Object`_
    :Constraints: Only applies to Questions for Fields of type ``enumeration``
                  or ``enumerationSet``
    :Description: This property contains the list of Enumerations that are
                  presented to the user for them to choose from. The order that
                  the Enumeration Objects are placed in this property is the
                  same order that they will be presented on the front end.

questions
    :Type: Array of `Question Object`_
    :Constraints: Required for Fields of type ``recordList`` or ``matrix``
    :Description: This property allows the author to specify the sequence and
                  configuration of the child Fields contained within a
                  ``recordList`` or ``matrix`` Field. For matrices, these
                  questions correspond to the columns.

rows
    :Type: Array of `Descriptor Object`_
    :Constraints: Required for Fields of type ``matrix``
    :Description: This property allows the author to specify the sequence and
                  configuration of the rows in a ``matrix`` field.

widget
    :Type: `Widget Configuration Object`_
    :Description: This property allows the Form author to override or provide
                  additional configuration options to the front-end widget that
                  will be used to collect the response from the user. This
                  property is optional, and, if not specified, will result in
                  the default widget to be used for the data type of the
                  Field.

events
    :Type: Array of `Event Object`_
    :Description: This property allows for the configuration of different events
                  or actions to occur to the Question based on satisfying the
                  specified expressions. This property is optional and has no
                  default value.


Descriptor Object
------------------
A Descriptor Object is the means with which an author defines the text of
simple facets of a Form such as Enumerations and Matrix Rows.

id
    :Type: String
    :Constraints: Required
    :Description: This property is a reference to the ID of an Enumeration or
                  Row on the Field that is defined in the associated Instrument
                  Definition.

text
    :Type: `Localized String Object`_
    :Constraints: Required
    :Description: This property allows the Form author to provide a more
                  detailed description for the Enumeration/Row rather than
                  displaying a code.

help
    :Type: `Localized String Object`_
    :Description: This property allows the Form author to supply additional
                  text that will be provided as help content for the
                  Enumeration/Row. This property is optional.


Event Object
------------
An Event Object represents an action that the Form will take when a
particular condition is met. This object consists of the following properties:

trigger
    :Type: String
    :Constraints: Required
    :Description: This property specifies a REXL expression that, when
                  it evaluates to a truthy value, will then cause the ``action``
                  specified in this `Event Object`_ to execute.

action
    :Type: Enumerated String
    :Constraints: Required
    :Description: This property indicates which action the front-end application
                  should take when the corresponding expression evaluates to a
                  truthy value.
    :PossibleValues: ================== =============================== =================== ===========
                     Action             Applicable Elements             Applies to Pages    Description
                     ================== =============================== =================== ===========
                     hide               question, header, text, divider Yes                 Completely hides the element from the user.
                     disable            question, header, text, divider Yes                 Shows the element to the user, but does not allow them to interact with or respond to it.
                     hideEnumeration    question                        No                  Hides the specified enumerations (in ``enumeration`` and ``enumerationSet`` Questions) from the user.
                     fail               question                        No                  Causes the response to the Question to be considered "invalid", meaning the user must change it before they can successfully complete the Form.
                     calculate          question                        No                  Causes the response to the Question to be automatically calculated using an expression.
                     ================== =============================== =================== ===========

targets
    :Type: Array of `Identifier`_
    :Description: This property specifies which Element(s) are impacted by the
                  ``action`` being executed. These Identifiers can either be
                  either references to the ``fieldId`` of Questions, the ``id``
                  of Pages, or a tag specified by one or more Elements in the
                  ``tags`` property. If not specified, it is implied that the
                  ``action`` applies to the Question the Event is associated
                  with.

options
    :Type: Object
    :Constraints: The contents of the Object depend on the ``action`` specified.
    :Descriptions: This property allows the Form author to provide configuration
                   parameters to the ``action`` being executed. This property
                   is optional.
    :PossibleValues: ============== =================== ===========
                     Option         Applicable Actions  Description
                     ============== =================== ===========
                     text           fail                A `Localized String Object`_ that contains the error message to show on the target question.
                     enumerations   hideEnumeration     A list of enumeration IDs to hide on the target question.
                     calculation    calculate           The REXL expression to use to calculate the value for the target Question.
                     ============== =================== ===========


Widget Configuration Object
---------------------------
A Widget Configuration Object is the means to specify which front-end data
collection component should be used and to provide configuration parameters for
that component. This object consists of a couple properties:

type
    :Type: Enumerated String
    :Constraints: Required
    :Description: This property indicates the type of the front-end widget that
                  should be used.
    :PossibleValues: ============== ======================= ===========
                     Type           Applicable Field Types  Description
                     ============== ======================= ===========
                     inputText      text*                   A single-line text box.
                     inputNumber    integer*, float*        A single-line text box optimized for numeric input.
                     textArea       text                    A multi-line text box.
                     radioGroup     enumeration*, boolean*  A group of radio button options that only allows one selection.
                     checkGroup     enumerationSet*         A group of checkbox options that allows multiple selections.
                     dropDown       enumeration, boolean    A drop-down selection box that only allows one selection.
                     datePicker     date*                   TBD
                     timePicker     time*                   TBD
                     dateTimePicker dateTime*               TBD
                     ============== ======================= ===========

                     Field types notated with a ``*`` use that widget by default.

options:
    :Type: Object
    :Constraints: The contents of the Object depend on the widget specified in
                  the ``type`` property.
    :Descriptions: This property allows the Form author to provide configuration
                   parameters to the widget being used. This property is
                   optional.
    :PossibleValues: ========== =================================== =========== ===========
                     Option     Applicable Widgets                  Default     Description
                     ========== =================================== =========== ===========
                     width      inputText, inputNumber, textArea    medium      Specifies the width of the widget. Allows ``small``, ``medium``, or ``large``.
                     height     textArea                            medium      Specifies the height of the widget. Allows ``small``, ``medium``, or ``large``.
                     ========== =================================== =========== ===========


Unprompted Collection Object
----------------------------
An Unprompted Collection Object consists of one to many properties where the
property name serves as a reference to the ID of a Field defined in the
associated Instrument, and the value of that property is an `Unprompted Object`_
which contains the the information about how to handle that Field.


Unprompted Object
-----------------
An Unprompted Object defines how to handle a Field that is not presented to
the end user in any Questions within the Form. It consists of the
following properties:

action
    :Type: Enumerated String
    :Constraints: Required
    :Description: This property indicates which action should be taken for this
                  Field.
    :PossibleValues: ================== ===========
                     Action             Description
                     ================== ===========
                     calculate          Causes the response to the Question to be automatically calculated using an expression.
                     ================== ===========

options
    :Type: Object
    :Constraints: The contents of the Object depend on the ``action`` specified.
    :Descriptions: This property allows the Form author to provide configuration
                   parameters to the ``action`` being executed. This property is
                   optional.
    :PossibleValues: ============== =================== ===========
                     Option         Applicable Actions  Description
                     ============== =================== ===========
                     calculation    calculate           The REXL expression to use to calculate the value for the target Field.
                     ============== =================== ===========

Parameter Collection Object
---------------------------
A Parameter Collection object consists of one-to-many properties where the
proeprty name serves as a reference to a variable that will be supplied to the
Form rendering engine from an external source. These variableso can be used in
any event logic, and can be substituted into the text of any element that
renders text. The ID of the property is in the format of an `Identifier`_ and
the value is a `Parameter Object`_.


Parameter Object
----------------
A Parameter object describes the nature of the incoming parameter. It consists
of the following properties:

type
    :Type: Enumerated String
    :Contraints: Required
    :Description: This property indicates the rough data type of the value that
                  will be received in this variable.
    :PossibleValues: ``numeric``, ``text``, ``boolean``


Localized String Object
-----------------------
A Localized String Object is a generic container that allows the configuration
author to provide text for use in a Form that is accompanied with localized
(translated) versions of that text. This object contains one or more properties,
where each property is a `RFC5646`_ Language Tag. The values of all the
properties are the localized versions of the same text.

.. _`RFC5646`: http://tools.ietf.org/html/rfc5646

Example::

    {
        "en": "What is the subject’s age?",
        "fr": "Quel est l’âge du sujet?"
    }

Every Localized String Object within a given Web Form Configuration must
contain at least one property that is keyed with the same Language Tag that is
defined in the defaultLocalization property of the `Root Object`_. This ensures
that the application responsible for displaying the Form can be guaranteed to
always have at least one known text string available to it.


Identifier
----------
Identifiers are strings that are unique throughout the *entire* context of the
Form. This string must adhere to the following restrictions:

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

These identifiers are can be used both by expressions within this Form, and by
any supplemental configuration documents that may augment this Form.

Example Unique Identifiers:

* page1
* grp_a
* ref-1-2-alpha


JSON Schema
===========

.. literalinclude:: web_form_configuration.json
   :language: javascript

