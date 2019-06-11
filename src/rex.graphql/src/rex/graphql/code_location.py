"""

    rex.graphql.code_location
    =========================

    Utilities for tracking locations in source code. This is useful to provide
    rich error messages which include the actual locations in the code base.

    :copyright: 2019-present Prometheus Research, LLC

"""

import inspect
import os
import contextlib

import rex.core

__all__ = ("here", "context", "autoloc")


class autoloc:
    def __repr__(self):
        return "<current location>"


autoloc = autoloc()


class CodeLocation:

    __slots__ = ("filename", "lineno", "code_context")

    def __init__(self, filename, lineno, code_context):
        self.filename = filename
        self.lineno = lineno
        self.code_context = code_context

    def __str__(self):
        # TODO: Cache os.getcwd() here? We probably can assume it doesn't change
        # during configuration phase.
        filename = os.path.relpath(self.filename, os.getcwd())
        code_context = self.code_context[0][:60].strip()
        lines = [filename, "...", f"{self.lineno} | {code_context} ...", "..."]
        return "\n".join(lines)


def here():
    """ Create code location object at the current code location."""
    frame = inspect.currentframe()
    info = inspect.getouterframes(frame, context=1)[2]
    return CodeLocation(
        filename=info.filename,
        lineno=info.lineno,
        code_context=info.code_context,
    )


@contextlib.contextmanager
def context(loc, desc=None):
    """ Inject information about code location into the error reporting."""
    if loc is None:
        yield
    else:
        if desc is None:
            desc = "Code at:"
        with rex.core.guard(desc, loc):
            yield
