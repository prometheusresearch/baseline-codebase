**********************************
  REX.SENDMAIL Programming Guide
**********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: func(literal)


Overview
========

This package provides a uniform interface for sending email messages.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Composing and sending emails
============================

:mod:`rex.sendmail` provides a convenient set of functions for sending emails.

By default, outgoing emails are delivered to the local SMTP server.  For
demonstration purposes, we configure :mod:`rex.sendmail` to dump outgoing
emails to standard output::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.sendmail_demo', sendmail='-')

Now we can prepare and send an email message using
:func:`rex.sendmail.sendmail()`::

    >>> from rex.sendmail import sendmail

    >>> msg = """\
    ... From: Alice Anderson <alice@example.net>
    ... To: Bob Brown <bob@example.net>
    ... Cc: Clothilde Coleman <clothilde@example.net>
    ... Bcc: Daniel Delacruz <daniel@nsa.gov>
    ... Subject: Hi there!
    ... 
    ... Hi Bob!
    ... """

    >>> with demo:
    ...     sendmail(msg)
    MAIL FROM:<alice@example.net>
    RCPT TO:<bob@example.net>
    RCPT TO:<clothilde@example.net>
    RCPT TO:<daniel@nsa.gov>
    DATA
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    Cc: Clothilde Coleman <clothilde@example.net>
    Subject: Hi there!
    <BLANKLINE>
    Hi Bob!
    .

:mod:`rex.sendmail` collects the list of recipients from the headers ``To``,
``Cc`` and ``Bcc``.  Note that the ``Bcc`` header has been removed from the
email message.

:func:`.sendmail()` also accepts instances of :class:`email.message.Message`
class, which allows you to build email messages programmatically::

    >>> from email.mime.text import MIMEText
    >>> from email.utils import formataddr

    >>> msg = MIMEText("""Hi Bob!""")
    >>> msg['From'] = formataddr(("Alice Anderson", "alice@example.net"))
    >>> msg['To'] = formataddr(("Bob Brown", "bob@example.net"))
    >>> msg['Cc'] = formataddr(("Clothilde Coleman", "clothilde@example.net"))
    >>> msg['Bcc'] = formataddr(("Daniel Delacruz", "daniel@nsa.gov"))
    >>> msg['Subject'] = "Hi there!"

    >>> with demo:
    ...     sendmail(msg)
    MAIL FROM:<alice@example.net>
    RCPT TO:<bob@example.net>
    RCPT TO:<clothilde@example.net>
    RCPT TO:<daniel@nsa.gov>
    DATA
    Content-Type: text/plain; charset="us-ascii"
    MIME-Version: 1.0
    Content-Transfer-Encoding: 7bit
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    Cc: Clothilde Coleman <clothilde@example.net>
    Subject: Hi there!
    <BLANKLINE>
    Hi Bob!
    .

:mod:`rex.sendmail` provides a convenience function for constructing email
messages from Jija templates.  Suppose we add template ``/email/hi.txt`` to
the :mod:`rex.sendmail_demo` package::

    From: Alice Anderson <alice@example.net>
    To: {{ name }} <{{ email }}>
    Subject: Hi there!

    Hi {{ name.split()[0] }}!

This template takes two parameters: ``name`` and ``email``.  We could convert
this template to an email object using function :func:`rex.sendmail.compose()`::

    >>> from rex.sendmail import compose

    >>> with demo:
    ...     msg = compose('rex.sendmail_demo:/email/hi.txt',
    ...                   name="Bob Brown", email="bob@example.net")
    ...     sendmail(msg)
    MAIL FROM:<alice@example.net>
    RCPT TO:<bob@example.net>
    DATA
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    Subject: Hi there!
    <BLANKLINE>
    Hi Bob!
    .


Configuring mailers
===================

By default, :mod:`rex.sendmail` sends outgoing mail to a local SMTP server at
``127.0.0.1:25``.  You could override the address of the server using setting
``sendmail``.  For example, to send outgoing email to a remote SMTP server at
address ``smtp.sendgrid.net:587``, specify::

    sendmail: smtp:smtp.sendgrid.net:587

When you test an application, it's often convenient to ignore the recipient
list and send all outgoing email to some fixed email address.  You can do it by
specifying the email as a value of the ``sendmail`` setting::

    sendmail: alice@prometheusresearch.com

You can disable email delivery completely by specifying ``null`` as a value of
``sendmail``::

    sendmail: null

See the :mod:`rex.sendmail` reference for more configuration options.



