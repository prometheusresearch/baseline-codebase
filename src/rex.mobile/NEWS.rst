*********************
REX.MOBILE Change Log
*********************

.. contents:: Table of Contents


0.8.0 (2016-12-01)
==================

* The ``MobileError`` exception now inherits from ``rex.core.Error``.
* The ability to generate Interation skeletons based on Instrument Definitions
  as well as Form skeletons based on Interaction Configurations has been
  exposed via the ``make_interaction_skeleton()`` and ``make_form_skeleton()``
  functions.


0.7.1 (2016-08-12)
==================

* Minor tweaks to the test suite.


0.7.0 (2016-07-14)
==================

* Updated rios.core dependency.


0.6.0 (2016-01-29)
==================

* Updated rios.core dependency.


0.5.0 (2015-11-20)
==================

* Updated rex.ctl tasks to use log() function instead of print statements.


0.4.0 (2015-10-21)
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

