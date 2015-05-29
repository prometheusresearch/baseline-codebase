*************************
REX.FORMS Upgrading Notes
*************************

.. contents:: Table of Contents


In situations when breaking changes are introduced to this package, this
document will outline those changes, and provide some guidance on how to
address those changes in your implementation.


0.30.0
======

* The Channel, Task, and Entry interface classes were moved to the
  ``rex.instrument`` package. This means:

  * You'll need to update any import statements that refer to these classes.
  * When using the ``get_implementation()`` function, you no longer have to
    specify ``forms`` as the package argument for these classes.
  * Any place you used the ``forms_implementation`` setting in reference to
    these classes, you'll need to update it to ``instrument_implementation``.

* The TaskCompletionProcessor and ParameterSupplier extensions were moved to
  the ``rex.instrument`` package. Be sure to update any related import
  statements.

* The setting ``forms_default_required_entries`` no longer exists. It is now
  handled by the ``instrument_default_required_entries`` setting provided by
  the ``rex.instrument`` package.

* Identifier strings referenced in the Form Configurations can no longer
  contain underscore characters.

