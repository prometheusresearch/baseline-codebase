#
# Copyright (c) 2013, Prometheus Research, LLC
#


import threading


class RexContext(threading.local):
    """Holds the active Rex application in the current thread."""

    def __init__(self):
        self._active_app = None
        self._app_stack = []

    def push(self, app):
        self._app_stack.append(self._active_app)
        self._active_app = app

    def pop(self):
        self._active_app = self._app_stack.pop()

    def __call__(self):
        assert self._active_app is not None, \
                "no Rex application has been activated"
        return self._active_app


get_rex = RexContext()


