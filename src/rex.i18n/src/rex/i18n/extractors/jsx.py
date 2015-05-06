#
# Copyright (c) 2014, Prometheus Research, LLC
#


try:
    from cStringIO import StringIO
except ImportError:  # pragma: no cover
    from StringIO import StringIO

from babel.messages.extract import extract_javascript
from react.jsx import JSXTransformer


__all__ = (
    'extract_jsx',
)


def extract_jsx(fileobj, keywords, comment_tags, options):
    """Extract messages from JSX-augmented JavaScript files.

    :param fileobj: the file-like object the messages should be extracted
                    from
    :param keywords: a list of keywords (i.e. function names) that should
                     be recognized as translation functions
    :param comment_tags: a list of translator tags to search for and
                         include in the results
    :param options: a dictionary of additional options (optional)
    :return: an iterator over ``(lineno, funcname, message, comments)``
             tuples
    :rtype: ``iterator``
    """

    # Read in the file.
    encoding = options.get('encoding', 'utf-8')
    raw_file = fileobj.read().decode(encoding)

    # Transform the JSX to JS.
    jsx = JSXTransformer().transform_string(raw_file)

    # Create a file-like object to wrap the transformed file.
    fileobj = StringIO(jsx.encode('utf-8'))

    # Update the options to reflect the encoding we used in our file-like obj.
    opts = {}
    opts.update(options)
    opts['encoding'] = 'utf-8'

    # Feed the transformed code to Babel's built-in JS extractor.
    for msg in extract_javascript(fileobj, keywords, comment_tags, opts):
        yield msg

