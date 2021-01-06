#
# Copyright (c) 2014, Prometheus Research, LLC
#


"""
This package allows you to send emails.
"""


from rex.core import (Setting, MaybeVal, StrVal, get_packages, get_settings,
        cached, Initialize, Error, guard)
from rex.web import get_jinja
import email
import email.mime.text
import email.mime.multipart
import email.mime.image
import os
import fcntl
import re
import smtplib
import textwrap
from html.parser import HTMLParser


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
    mailer(sender, recipients, message)


def compose(template_path, html_template_path=None, **arguments):
    """
    Composes an email object from a template.

    `template_path`
        Path to the template in ``<package>:<path>`` format.

        This template is used to specify ``text/plain`` body of the email
        message but also to specify fields (Subject, ...). See
        :func:`email.message_from_string` from stdlib for more info.
    `html_template_path`
        Path to the HTML template in ``<package>:<path>`` format.

        This is optional. If supplied then email with contain both text and html
        messages (html is preferred in this case).

        Also ``<img src="cid:relativepath">`` HTML elements will be found and
        referenced images will be attached as well.
    `arguments`
        Template parameters.
    """
    jinja = get_jinja()
    text = jinja.get_template(template_path).render(**arguments)
    text_message = email.message_from_string(text)
    msg_headers = list(text_message.items())
    body_text = text_message.get_payload()
    text_message.set_charset('utf-8')

    if html_template_path:
        # Produces the following message structure:
        #
        # - alternative
        #   - text
        #   - related
        #     - html
        #     - images...

        with guard("While rendering the template:", html_template_path):
            body_html = jinja.get_template(html_template_path).render(**arguments)
            html_text_message = email.mime.text.MIMEText(body_html, 'html')

            # Find all images and attach them to the email message
            images = FindImages.from_string(body_html)
            if images:
                html_message = email.mime.multipart.MIMEMultipart('related')
                html_message.attach(html_text_message)
                packages = get_packages()
                dir = os.path.dirname(packages.abspath(html_template_path))
                for cid, filename in images:
                    try:
                        with open(os.path.join(dir, filename), 'rb') as fp:
                            img = email.mime.image.MIMEImage(fp.read())
                            img.add_header('Content-ID', f'<{cid}>')
                            html_message.attach(img)
                    except Exception as exc:
                        err = Error("Unable to attach image:", f"cid:{filename}")
                        raise err from exc
            else:
                html_message = html_text_message

        # Redefine message as alternative with html and tect attachments
        message = email.mime.multipart.MIMEMultipart('alternative')
        for k, v in msg_headers:
            message[k] = v
            del text_message[k]
        message.attach(text_message)
        message.attach(html_message) # the last attachment is preferred

    else:
        body_html = None
        message = text_message

    # Stash the actual rendered contents onto top-level properties for easy
    # access by users.
    setattr(message, 'body_text', body_text)
    setattr(message, 'body_html', body_html)

    return message


class FindImages(HTMLParser):
    # Finds <img src="cid:..." /> in HTML

    def __init__(self):
        super(FindImages, self).__init__()
        self.images = set()

    def handle_starttag(self, tag, attrs):
        if tag.upper() == 'IMG':
            for name, value in attrs:
                if name.upper() == 'SRC' and value.startswith('cid:'):
                    filename = value[4:] # strip 'cid:'
                    self.images.add((filename, filename))

    @classmethod
    def from_string(cls, value):
         p = cls()
         p.feed(value)
         return list(p.images)


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

    def __call__(self, sender, recipients, message):
        """
        Sends an email.

        `sender`
            Envelope sender.
        `recipients`
            A list of envelope recipients.
        `message`
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
    `username`, `password`
        Information for authenticating with the SMTP server.
    """

    def __init__(self, host='127.0.0.1', port=25, forward=None, username=None, password=None):
        self.host = host
        self.port = port
        self.forward = forward
        self.username = username
        self.password = password

    def initialize(self):
        smtp = smtplib.SMTP()
        try:
            smtp.connect(self.host, self.port)
            if self.username and self.password:
                smtp.login(self.username, self.password)
            smtp.quit()
        except Exception as exc:
            raise Error("Failed to connect to SMTP server at %s:%s:"
                        % (self.host, self.port), exc)

    def __call__(self, sender, recipients, message):
        text = message.as_string()
        if self.forward is not None:
            recipients = [self.forward]
        smtp = smtplib.SMTP()
        smtp.connect(self.host, self.port)
        if self.username and self.password:
            smtp.login(self.username, self.password)
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
        if self.username is not None:
            args.append("username=%r" % self.username)
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

    def __call__(self, sender, recipients, message):
        text = message.as_string()
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

    def __call__(self, sender, recipients, message):
        print("MAIL FROM:<%s>" % sender)
        for recipient in recipients:
            print("RCPT TO:<%s>" % recipient)
        print("DATA")
        for line in message.as_string().splitlines():
            if line.startswith('.'):
                line = "."+line
            print(line)
        print(".")

    def __str__(self):
        return "-"


class TestingMailer(Mailer):
    """
    Dumps the message to stdout in an easier-for-humans-to-read format for
    testing.
    """

    def __call__(self, sender, recipients, message):
        print('SENDER:\n  %s' % (sender,))

        print('RECIPIENTS:')
        for recipient in recipients:
            print('  %s' % (recipient,))

        headers, _ = message.as_string().split('\n\n', 1)
        print('HEADERS:\n%s' % (textwrap.indent(headers, '  '),))

        if message.is_multipart():
            print('STRUCTURE:')
            self.output_structure(message)

            print('CONTENTS:')
            for part in message.walk():
                if part.get_content_maintype() == 'text':
                    print('  %s:' % (part.get_content_type(),))
                    print(textwrap.indent(
                        part.get_payload(decode=True,).decode('utf-8'),
                        '    ',
                    ))

        else:
            print('BODY:')
            print(textwrap.indent(
                message.get_payload(decode=True,).decode('utf-8'),
                '  ',
            ))

    def output_structure(self, message, depth=0):
        indent = '    ' * depth

        print(
            '  %stype=%s, disposition=%s, encoding=%s, id=%s' % (
                indent,
                message.get_content_type(),
                message.get_content_disposition(),
                message.get('Content-Transfer-Encoding'),
                message.get('Content-ID'),
            )
        )

        if message.is_multipart():
            for part in message.get_payload():
                self.output_structure(part, depth=depth + 1)

    def __str__(self):
        return 'test'


class NullMailer(Mailer):
    """
    A no-op mailer.
    """

    def __call__(self, sender, recipients, message):
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

        sendmail: test

    Or, you could dump the content of all sent emails to stdout in a more
    verbose, raw format::

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
        (?P<testing> test ) |
        (?P<stdout> - )
    """
    validate = MaybeVal(StrVal(pattern))
    default = "smtp:127.0.0.1"


class SendmailUsernameSetting(Setting):
    """
    User name for authenticating with the SMTP server.
    """

    name = 'sendmail_username'
    validate = MaybeVal(StrVal)
    default = None


class SendmailPasswordSetting(Setting):
    """
    Password for authenticating with the SMTP server.
    """

    name = 'sendmail_password'
    validate = MaybeVal(StrVal)
    default = None


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
                          match.group('smtp_email'),
                          settings.sendmail_username,
                          settings.sendmail_password)
    elif match.group('email'):
        return SMTPMailer("127.0.0.1", 25, match.group('email'))
    elif match.group('stdout'):
        return StdoutMailer()
    elif match.group('testing'):
        return TestingMailer()
    else:
        raise NotImplementedError() # not reachable


