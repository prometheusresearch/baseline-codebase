#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


import sys
import os
import textwrap
import raven


class Paragraph:
    # Represents error context as a text message with an optional payload.
    # Rendered as:
    #   <message>
    #       <payload>

    def __init__(self, message, payload=None):
        self.message = str(message)
        self.payload = payload

    def __str__(self):
        if self.payload is None:
            return self.message
        block = "\n".join("    "+line if line else ""
                          for line in str(self.payload).splitlines())
        return "%s\n%s" % (self.message, block)

    def __repr__(self):
        if self.payload is None:
            return "%s(%r)" % (self.__class__.__name__, self.message)
        else:
            return "%s(%r, %r)" % (self.__class__.__name__,
                                   self.message, self.payload)

    def __html__(self):
        # Render the paragraph in HTML.
        lines = []
        lines.append(self.message.replace("&", "&amp;")
                                 .replace("<", "&lt;")
                                 .replace(">", "&gt;"))
        if self.payload is not None:
            lines.append("<pre>%s</pre>" %
                         str(self.payload).replace("&", "&amp;")
                                          .replace("<", "&lt;")
                                          .replace(">", "&gt;"))
        return "<br />\n".join(lines)


class Error(Exception):
    """
    Exception with a context trace.

    `message`
        Error description.
    `payload`
        Optional data related to the error.

    :class:`Error` objects provide WSGI interface.  In ``text/plain``
    and traceback output, the exception is rendered as::

        {message}
            {payload}

    In ``text/html``, the exception is rendered as::

        {message}<br />
        <pre>{payload}</pre>

    Use :meth:`wrap()` to add more paragraphs.
    """

    # Display `rex.core.Error: ...` in tracebacks.
    __module__ = 'rex.core'

    # Template for rendering the error in plain text.
    text_template = textwrap.dedent("""\
        The server cannot understand the request due to malformed syntax.

        %s""")

    # Template for rendering the error in HTML.
    html_template = textwrap.dedent("""\
        <html>
        <head>
        <title>400 Bad Request</title>
        </head>
        <body>
        <h1>400 Bad Request</h1>
        The server cannot understand the request due to malformed syntax.<br /><br />
        %s
        </body>
        </html>""")

    def __init__(self, message, payload=None):
        paragraph = Paragraph(message, payload)
        self.paragraphs = [paragraph]

    def wrap(self, message, payload=None):
        """
        Adds a paragraph to the context trace.
        """
        paragraph = Paragraph(message, payload)
        self.paragraphs.append(paragraph)
        return self

    def __call__(self, environ, start_response):
        """
        WSGI entry point.
        """
        # If the client is a web browser (checking the same way as WebOb does),
        # render the error in HTML; otherwise, render it in plain text.
        accept = environ.get('HTTP_ACCEPT', '')
        if 'html' in accept or '*/*' in accept:
            content_type = 'text/html; charset=UTF-8'
            output = self.html_template % self.__html__()
        else:
            content_type = 'text/plain; charset=UTF-8'
            output = self.text_template % self
        output = output.encode('utf-8')
        start_response("400 Bad Request",
                       [('Content-Type', content_type),
                        ('Content-Length', str(len(output)))])
        return [output]

    def __str__(self):
        return "\n".join(str(paragraph) for paragraph in self.paragraphs)

    def __repr__(self):
        # Emit:
        #   Error(...).wrap(...).wrap(...)
        output = ""
        for paragraph in self.paragraphs:
            if not output:
                output = self.__class__.__name__
            else:
                output += ".wrap"
            if paragraph.payload is None:
                output += "(%r)" % paragraph.message
            else:
                output += "(%r, %r)" % (paragraph.message, paragraph.payload)
        return output

    def __html__(self):
        # Render the error in HTML.
        return "<br />\n".join(paragraph.__html__()
                               for paragraph in self.paragraphs)


class guard:
    """
    Adds a paragraph to exceptions leaving the wrapped ``with`` block.
    """

    def __init__(self, message, payload=None):
        self.message = message
        self.payload = payload

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if isinstance(exc_value, Error):
            exc_value.wrap(self.message, self.payload)


class guard_repr(guard):
    # Equivalent to guard(message, repr(payload)).

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if isinstance(exc_value, Error):
            exc_value.wrap(self.message, repr(self.payload))


def get_sentry(sync=False, context={}):
    """
    Returns a client for the Sentry error tracker.

    `sync`
        If set, switch to use a blocking HTTP transport.
    `context`
        Extra context to pass with the error report.
    """
    tags = {}
    for key in sorted(os.environ):
        value = os.environ[key]
        if key.startswith('SENTRY_') and key != 'SENTRY_DSN' and value:
            tags[key[7:].lower()] = value
    context = context.copy()
    if sync:
        transport = raven.transport.RequestsHTTPTransport
    else:
        transport = raven.transport.ThreadedRequestsHTTPTransport
    return raven.Client(
            dsn=None,
            tags=tags,
            context=context,
            transport=transport,
            install_sys_hook=False,
            install_logging_hook=False)


