#
# Copyright (c) 2013, Prometheus Research, LLC
#


class Paragraph(object):
    # Represents error context as a text message with an optional payload.
    # Rendered as:
    #   <message>
    #       <payload>

    def __init__(self, message, payload=None):
        self.message = message
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


class Error(Exception):
    """An exception with a context trace."""

    def __init__(self, message, payload=None):
        paragraph = Paragraph(message, payload)
        self.paragraphs = [paragraph]

    def wrap(self, message, payload=None):
        paragraph = Paragraph(message, payload)
        self.paragraphs.append(paragraph)
        return self

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


class guard(object):
    """Adds context to exceptions exiting the wrapped block."""

    def __init__(self, message, payload=None):
        self.message = message
        self.payload = payload

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if isinstance(exc_value, Error):
            exc_value.wrap(self.message, self.payload)


