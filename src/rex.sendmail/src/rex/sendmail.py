#
# Copyright (c) 2014, Prometheus Research, LLC
#


"""
This package allows you to send emails.
"""


from rex.core import (Setting, MaybeVal, StrVal, OneOrSeqVal, get_settings,
        cached, Initialize, Error)
from rex.web import get_jinja
import email
import os
import fcntl
import re
import smtplib


def sendmail(message):
    """
    Sends an email.

    `message`
        Must be a string in RFC 2822 format or an instance of a
        :class:`email.message.Message` class.

    The envelope sender is extracted from the ``From`` message header.
    The envelope recipients are extracted from the headers ``To``, ``Cc``,
    ``Bcc``, ``Resent-To``, ``Resent-Cc``, ``Resent-Bcc``.

    Headers ``Bcc`` and ``Resent-Bcc`` are removed from the email text.

    The email is sent using the mailer returned by :func:`get_mailer()`.
    """
    if isinstance(message, str):
        message = email.message_from_string(message)
    from_ = message.get('from', '')
    tos = []
    tos.extend(message.get_all('to', []))
    tos.extend(message.get_all('cc', []))
    tos.extend(message.get_all('bcc', []))
    tos.extend(message.get_all('resent-to', []))
    tos.extend(message.get_all('recent-cc', []))
    tos.extend(message.get_all('recent-bcc', []))
    del message['bcc']
    del message['recent-bcc']
    sender = email.utils.parseaddr(from_)[1]
    if not sender:
        raise Error("Email sender is not specified:",
                    "".join("%s: %s\n" % item for item in list(message.items())))
    recipients = [address[1] for address in email.utils.getaddresses(tos)
                             if address[1]]
    if not recipients:
        raise Error("Email recipients are not specified:",
                    "".join("%s: %s\n" % item for item in list(message.items())))
    mailer = get_mailer()
    mailer(sender, recipients, message.as_string())


def compose(package_path, **arguments):
    """
    Composes an email object from a template.

    `package_path`
        Path to the template in ``<package>:<path>`` format.
    `arguments`
        Template parameters.
    """
    jinja = get_jinja()
    template = jinja.get_template(package_path)
    text = template.render(**arguments)
    message = email.message_from_string(text)
    return message


class Mailer:
    """
    Interface for sending email messages.

    :mod:`rex.sendmail` provides several concrete implementations
    of this interface.
    """

    def initialize(self):
        """
        Validates mailer configuration.  This function is called
        when the Rex application is constructed to verify that the
        mailer is configured properly.
        """

    def __call__(self, sender, recipients, text):
        """
        Sends an email.

        `sender`
            Envelope sender.
        `recipients`
            A list of envelope recipients.
        `text`
            The message to send.
        """
        raise NotImplementedError()

    def __str__(self):
        raise NotImplementedError()

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class SMTPMailer(Mailer):
    """
    Sends the email via SMTP.

    `host`
        The hostname of the SMTP server.
    `port`
        The port of the SMTP server.
    `forward`
        If set, the list of recipients is ignored and instead
        all mail is forwarded to the specified address.
    """

    def __init__(self, host='127.0.0.1', port=25, forward=None):
        self.host = host
        self.port = port
        self.forward = forward

    def initialize(self):
        smtp = smtplib.SMTP()
        try:
            smtp.connect(self.host, self.port)
        except Exception as exc:
            raise Error("Failed to connect to SMTP server at %s:%s:"
                        % (self.host, self.port), exc)

    def __call__(self, sender, recipients, text):
        if self.forward is not None:
            recipients = [self.forward]
        smtp = smtplib.SMTP()
        smtp.connect(self.host, self.port)
        smtp.sendmail(sender, recipients, text)
        smtp.quit()

    def __str__(self):
        if self.port != 25:
            return "smtp://%s:%s/%s" \
                    % (self.host, self.port, self.forward or "")
        else:
            return "smtp://%s/%s" % (self.host, self.forward or "")

    def __repr__(self):
        args = []
        if self.host != '127.0.0.1' or self.port != 25:
            args.append(repr(self.host))
        if self.port != 25:
            args.append(repr(self.port))
        if self.forward is not None:
            args.append("forward=%r" % self.forward)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class MBoxMailer(Mailer):
    """
    Dumps the messages to a file in MBOXO format.

    `path`
        Path to the mbox file.
    """

    def __init__(self, path):
        self.path = path

    def initialize(self):
        directory = os.path.dirname(self.path)
        if directory and not os.path.isdir(directory):
            raise Error("Mailbox path is not valid:", self.path)

    def __call__(self, sender, recipients, text):
        with open(self.path, 'a') as mbox:
            fcntl.flock(mbox, fcntl.LOCK_EX)
            mbox.write("From %s %s\n" % (sender, email.utils.formatdate()))
            for line in text.splitlines():
                if line.startswith("From "):
                    line = ">"+line
                mbox.write("%s\n" % line)
            mbox.write("\n")

    def __str__(self):
        return "mbox://%s" % self.path

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.path)


class StdoutMailer(Mailer):
    """
    Dumps the message to stdout in format resembling an SMTP session.
    """

    def __call__(self, sender, recipients, text):
        print("MAIL FROM:<%s>" % sender)
        for recipient in recipients:
            print("RCPT TO:<%s>" % recipient)
        print("DATA")
        for line in text.splitlines():
            if line.startswith('.'):
                line = "."+line
            print(line)
        print(".")

    def __str__(self):
        return "-"


class NullMailer(Mailer):
    """
    A no-op mailer.
    """

    def __call__(self, sender, recipients, text):
        pass

    def __str__(self):
        return "null"


class InitializeSendmail(Initialize):
    # Verifies mailer configuration.

    def __call__(self):
        mailer = get_mailer()
        mailer.initialize()


class SendmailSetting(Setting):
    """
    Mailer configuration.

    By default, email is sent via a local SMTP server at 127.0.0.1:25.

    Using this setting, you can override the address of the server.
    Example::

        sendmail: smtp:smtp.sendgrid.net:587

    When testing the application, it's often desirable to ignore the list
    of recipients and send all messages to the email address of the tester.
    Example::

        sendmail: alice@prometheusresearch.com

    You can combine these two options as follows::

        sendmail: smtp:smtp.sendgrid.net:587/alice@prometheusresearch.com

    Another option is to store all the messages in a MBOX file.  Example::

        sendmail: mbox:/path/to/mbox

    When using doctest for testing the application, it's convenient to dump
    the content of all sent emails to stdout::

        sendmail: '-'

    Finally, you could disable sending emails::

        sendmail: null
    """

    name = 'sendmail'
    pattern = r"""(?x)
        mbox: (?: // )?
            (?P<mbox_path> \S+ ) |
        smtp: (?: // )?
            (?P<smtp_host> [\w.-]+ )
            (?: : (?P<smtp_port> \d+ ) )?
            (?: / (?P<smtp_email> \S+ @ [\w.-]+ )? )? |
        (?P<email> \S+ @ [\w.-]+ ) |
        (?P<stdout> - )
    """
    validate = MaybeVal(StrVal(pattern))
    default = "smtp:127.0.0.1"


@cached
def get_mailer():
    """
    Returns the mailer configured for the current application.
    """
    settings = get_settings()
    if settings.sendmail is None:
        return NullMailer()
    match = re.match(SendmailSetting.pattern, settings.sendmail, re.X)
    assert match is not None
    if match.group('mbox_path'):
        return MBoxMailer(match.group('mbox_path'))
    elif match.group('smtp_host'):
        return SMTPMailer(match.group('smtp_host'),
                          int(match.group('smtp_port') or '25'),
                          match.group('smtp_email'))
    elif match.group('email'):
        return SMTPMailer("127.0.0.1", 25, match.group('email'))
    elif match.group('stdout'):
        return StdoutMailer()
    else:
        raise NotImplementedError() # not reachable


