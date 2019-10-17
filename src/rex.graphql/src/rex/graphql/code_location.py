"""

    rex.graphql.code_location
    =========================

    Utilities for tracking locations in source code. This is useful to provide
    rich error messages which include the actual locations in the code base.

    :copyright: 2019-present Prometheus Research, LLC

"""

import inspect
import linecache
import os
import contextlib

import rex.core

__all__ = ("here", "context", "autoloc")


class autoloc:
    def __repr__(self):
        return "<current location>"


autoloc = autoloc()


class CodeLocation:

    __slots__ = ("filename", "lineno")

    def __init__(self, filename, lineno):
        self.filename = filename
        self.lineno = lineno

    def __str__(self):
        # TODO: Cache os.getcwd() here? We probably can assume it doesn't change
        # during configuration phase.
        code_context = linecache.getline(self.filename, self.lineno)[:60].strip()
        filename = os.path.relpath(self.filename, os.getcwd())
        lines = [filename, "...", f"{self.lineno} | {code_context} ...", "..."]
        return "\n".join(lines)


def here():
    """ Create code location object at the current code location."""
    frame = inspect.currentframe().f_back.f_back
    filename = inspect.getsourcefile(frame) or inspect.getfile(frame)
    lineno = frame.f_lineno
    return CodeLocation(
        filename=filename,
        lineno=lineno,
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
