**********************
REX.RESTFUL Change Log
**********************

.. contents:: Table of Contents


0.2.0 (xx/xx/2014)
==================

* Removed custom Route as the functionality is now incorporated in ``rex.web``.
* Removed UrlSerializer as it is a silly way to represent complex structures.
* Added a YamlSerializer.
* Fixed issues resulting from changes to ``rex.web``.
* Fixed handling of ``format`` as a querystring parameter.
* Now only HTTP Exceptions are encoded and returned to clients, any other hard
  exceptions will crash the request entirely.
* Added a SimpleResource extension to more easily implement the common-case
  endpoint of simple resources.
* Invalid payloads now result in a 400 rather than a crash.


0.1.0 (2/10/2014)
=================

* Initial implementation

