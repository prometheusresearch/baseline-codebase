******************
REX.SMS Change Log
******************

.. contents:: Table of Contents


1.0.0 (2015-09-30)
==================

* Major release!
* SmsProvider extensions no longer have to deal with logic around the
  ``sms_force_recipient`` setting. The TN to send the message to will always be
  sent in the ``recipient`` argument, and the original (un-forced) recipient
  will be sent in the ``original_recipient`` argument.


0.3.0 (2015-06-26)
==================

* Added a ``logging`` provider that sends messages through the rex.logging
  framework, rather than actually sending the SMS message.
* Upgraded Twilio client library.
* Added some automatic retrying to the Twilio provider, in case of server
  errors.


0.2.0 (2015-03-26)
==================

* Added support for ``rex.setup`` v2.
* Now leveraging ``rex.core`` 1.9+ features.


0.1.0 (2014-12-16)
==================

* Initial release.

