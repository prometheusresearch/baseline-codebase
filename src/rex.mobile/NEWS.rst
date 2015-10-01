*********************
REX.MOBILE Change Log
*********************

.. contents:: Table of Contents


0.4.0 (2015-xx-xx)
==================

* Updated all references of PRISMH to RIOS (including changing the dependency
  to rios.core).


0.3.0 (2015-09-30)
==================

* Updated prismh.core and rex.instrument dependencies.
* Added a ``get_implementation()`` method to all Interface classes as a
  convenience wrappper around the same function in the utils module.
* The Interaction.get_for_task() method now accepts Task instances and UIDs.


0.2.0 (2015-06-23)
==================

* Added ability to pass implementation-specific parameters to the ``create()``
  and ``save()`` methods of Interaction. This is done via the
  ``implementation_context`` dictionary argument.
* Interface classes that accept the ``implementation_context`` argument also
  have a ``get_implementation_context()`` method that describes the extra
  variables that are allowed.


0.1.0 (2015-06-26)
==================

* Initial release for review.

