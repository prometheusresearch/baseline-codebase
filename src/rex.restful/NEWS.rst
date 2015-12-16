**********************
REX.RESTFUL Change Log
**********************

.. contents:: Table of Contents


1.1.0 (2015-xx-xx)
==================

* Added a ``make_response`` method to RestfulLocation to allow implementations
  to generate their own, serialized Response object that can be returned. This
  allows implementations to alter things like the response status code, add
  HTTP headers, etc.


1.0.0 (2015-09-30)
==================

* Major release!
* Added automatic logging of request and response information (disabled by
  default).


0.4.1 (2015-06-12)
==================

* Removed explicit setup dependency on ``rex.setup``.


0.4.0 (2015-03-26)
==================

* Fixed an issue where if a Content-Type is sent on a PUT/POST, but no there is
  no request body, the response would vary depending on the Serializer used.
  Now, the payload will always be an empty dict.
* Fixed issue with unicode in YAML serialization.
* Added the ability to define validators that will be used upon the incoming
  payloads of PUT/POST requests.
* Added the ability to pass arguments to the serializers from resource
  implementations.


0.3.0 (2015-01-30)
==================

* Added support for rex.setup v2.
* Refactored Serializer mapping.
* Removed custom ``priority`` implementation on RestfulLocation in favor of
  ``rex.core``'s ``priority`` and ``ordered()`` functionality.


0.2.1 (9/23/2014)
=================

* Added support for rex.web v3.


0.2.0 (8/27/2014)
=================

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
* Fixed a crash that occurred when unexpected parameters were encountered.


0.1.0 (2/10/2014)
=================

* Initial implementation

