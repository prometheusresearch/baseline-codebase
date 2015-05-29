******************************
REX.INSTRUMENT Upgrading Notes
******************************

.. contents:: Table of Contents


In situations when breaking changes are introduced to this package, this
document will outline those changes, and provide some guidance on how to
address those changes in your implementation.


0.16.0
======

* The Channel, Task, and Entry interface classes were moved from the
  ``rex.forms`` package to this package.  This means:

  * You'll need to update any import statements that refer to these classes.
  * When using the ``get_implementation()`` function, you no longer have to
    specify ``forms`` as the package argument for these classes.
  * Any place you used the ``forms_implementation`` setting in reference to
    these classes, you'll need to update it to ``instrument_implementation``.

* The TaskCompletionProcessor and ParameterSupplier extensions were moved from
  the ``rex.forms`` package to this package. Be sure to update any related
  import statements.

* Channels must be classifed according to the type of configurations they use
  to present Instruments to users. The two supported types are ``form`` and
  ``sms``.

* Tasks no longer have a ``get_form()`` method. To retrive a Form for a given
  Task, you can instead do::
  
    Forms.get_for_task(task, channel)

* Identifier strings in the Instrument Definitions can no longer contain
  underscore characters. Also, custom type names are now classifed as
  Identifier strings.

