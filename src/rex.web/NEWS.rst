**********************
  REX.WEB Change Log
**********************

.. contents:: Table of Contents


2.2.0 (2014-XX-XX)
==================

* When reporting duplicate paths, display the targets.
* When the URL matches a command path except for the trailing ``/``,
  redirect to URL + ``/``.


2.1.0 (2014-04-16)
==================

* Added function ``url_for()`` and Jinja filter ``url`` that convert
  ``<package>:<path>`` to a URL.


2.0.0 (2014-03-07)
==================

* Added setting ``access``; enhanced ``authorize()``.
* Added path matching utilities.


1.1.1 (2013-12-13)
==================

* Minor updates to test data.


1.1.0 (2013-11-20)
==================

* Force the ``urlencode`` filter to escape the ``/`` character.
* Made the routing pipeline extensible.
* Added NIH acknowledgement (Clark Evans).


1.0.0 (2013-10-11)
==================

* Initial implementation (Kyrylo Simonov).


