****************
  Sending mail
****************

.. contents:: Table of Contents


``sendmail()`` and ``compose()``
================================

In these examples, we configure ``rex.sendmail`` to dump outgoing email to
stdout::

    >>> from rex.core import Rex, LatentRex

    >>> demo = Rex('rex.sendmail_demo', sendmail='-')

Use function ``sendmail()`` from ``rex.sendmail`` to send email messages.  It
accepts both strings and ``email.message.Message`` objects::

    >>> from rex.sendmail import sendmail

    >>> msg = """\
    ... From: Alice Anderson <alice@example.net>
    ... To: Bob Brown <bob@example.net>
    ... Subject: Hi there!
    ... 
    ... Hi Bob!
    ... """

    >>> with demo:
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

    >>> from email.mime.text import MIMEText
    >>> from email.utils import formataddr

    >>> msg = MIMEText("""Hi Bob!""")
    >>> msg['From'] = formataddr(("Alice Anderson", "alice@example.net"))
    >>> msg['To'] = formataddr(("Bob Brown", "bob@example.net"))
    >>> msg['Subject'] = "Hi there!"

    >>> with demo:
    ...     sendmail(msg)
    MAIL FROM:<alice@example.net>
    RCPT TO:<bob@example.net>
    DATA
    Content-Type: text/plain; charset="us-ascii"
    MIME-Version: 1.0
    Content-Transfer-Encoding: 7bit
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    Subject: Hi there!
    <BLANKLINE>
    Hi Bob!
    .

The message must contain a sender and at least one recipient::

    >>> msg = """\
    ... Subject: Hi there!
    ... """
    >>> with demo:
    ...     sendmail(msg)
    Traceback (most recent call last):
      ...
    rex.core.Error: Email sender is not specified:
        Subject: Hi there!

    >>> msg = """\
    ... From: Alice Anderson <alice@example.net>
    ... Subject: Hi there!
    ... """
    >>> with demo:
    ...     sendmail(msg)
    Traceback (most recent call last):
      ...
    rex.core.Error: Email recipients are not specified:
        From: Alice Anderson <alice@example.net>
        Subject: Hi there!

Use ``compose()`` to generate a message from a template::

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

You can get direct access to the mailer object using ``get_mailer()``
function::

    >>> from rex.sendmail import get_mailer

    >>> with demo:
    ...     mailer = get_mailer()

    >>> mailer
    StdoutMailer()
    >>> print(mailer)
    -


Mailers
=======

The default mailer uses the local SMTP server to send outgoing mail::

    >>> default_demo = LatentRex('rex.sendmail_demo')

    >>> with default_demo:
    ...     mailer = get_mailer()
    >>> mailer
    SMTPMailer()
    >>> print(mailer)
    smtp://127.0.0.1/

On startup, we check if we could connect to the SMTP server::

    >>> smtp_demo = Rex('rex.sendmail_demo',
    ...                 sendmail='smtp:127.0.0.1:22225')    # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to connect to SMTP server at 127.0.0.1:22225:
        [Errno ...] Connection refused
    ...

To test the server, we'll create a fake SMTP server::

    >>> import smtpd, asyncore, threading, socket

    >>> def smtpd_target():
    ...     server = smtpd.DebuggingServer(('127.0.0.1', 22225), None, decode_data=True)
    ...     asyncore.loop()

    >>> smtpd_thread = threading.Thread(target=smtpd_target)
    >>> smtpd_thread.daemon = True
    >>> smtpd_thread.start()

    >>> while socket.socket().connect_ex(('127.0.0.1', 22225)) != 0:
    ...     pass

Now we can test the client code::

    >>> msg = """\
    ... From: Alice Anderson <alice@example.net>
    ... To: Bob Brown <bob@example.net>
    ... Subject: Hi there!
    ... 
    ... Hi Bob!
    ... """

    >>> smtp_demo = Rex('rex.sendmail_demo', sendmail='smtp:127.0.0.1:22225')

    >>> with smtp_demo:
    ...     mailer = get_mailer()
    >>> mailer
    SMTPMailer('127.0.0.1', 22225)
    >>> print(mailer)
    smtp://127.0.0.1:22225/

    >>> with smtp_demo:
    ...     sendmail(msg)
    ---------- MESSAGE FOLLOWS ----------
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    Subject: Hi there!
    X-Peer: 127.0.0.1
    <BLANKLINE>
    Hi Bob!
    ------------ END MESSAGE ------------

You can force the mailer to ignore the recipient list and forward all mail to a
specific address::

    >>> forward_demo = Rex('rex.sendmail_demo',
    ...                    sendmail='smtp:127.0.0.1:22225/xi@resolvent.net')

    >>> with forward_demo:
    ...     mailer = get_mailer()
    >>> mailer
    SMTPMailer('127.0.0.1', 22225, forward='xi@resolvent.net')
    >>> print(mailer)
    smtp://127.0.0.1:22225/xi@resolvent.net

    >>> with forward_demo:
    ...     sendmail(msg)                           # doctest: +ELLIPSIS
    ---------- MESSAGE FOLLOWS ----------
    From: Alice Anderson <alice@example.net>
    ...
    ------------ END MESSAGE ------------

Another option useful for testing is to dump all outgoing messages to a file in
MBOX format::

    >>> mbox_demo = Rex('rex.sendmail_demo',
    ...                 sendmail='mbox:/path/does/not/exist')   # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Mailbox path is not valid:
        /path/does/not/exist
    ...

    >>> mbox_demo = Rex('rex.sendmail_demo', sendmail='mbox:./sandbox/mbox')

    >>> with mbox_demo:
    ...     mailer = get_mailer()
    >>> mailer
    MBoxMailer('./sandbox/mbox')
    >>> print(mailer)
    mbox://./sandbox/mbox

    >>> with mbox_demo:
    ...     sendmail(msg)

    >>> mbox = open('./sandbox/mbox')
    >>> print(mbox.read())                   # doctest: +ELLIPSIS
    From alice@example.net ...
    From: Alice Anderson <alice@example.net>
    To: Bob Brown <bob@example.net>
    ...

Finally, you can use a null mailer, which simply discards all outgoing
messages::

    >>> null_demo = Rex('rex.sendmail_demo', sendmail=None)

    >>> with null_demo:
    ...     mailer = get_mailer()
    >>> mailer
    NullMailer()
    >>> print(mailer)
    null

    >>> with null_demo:
    ...     sendmail(msg)



