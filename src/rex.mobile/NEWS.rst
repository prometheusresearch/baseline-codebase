*********************
REX.MOBILE Change Log
*********************

.. contents:: Table of Contents


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

