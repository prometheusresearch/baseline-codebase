#
# Copyright (c) 2013, Prometheus Research, LLC
#


import threading


class RexContext(threading.local):
    """
    Returns the current active application.

    The active application is local to a thread.
    """

    def __init__(self):
        self._active_app = None
        self._app_stack = []

    def push(self, app):
        # Activates the application.
        self._app_stack.append(self._active_app)
        self._active_app = app

    def pop(self, app):
        # Deactivates the application.
        assert self._active_app is app, "unexpected Rex application"
        self._active_app = self._app_stack.pop()

    def __call__(self):
        # Returns the current active application.
        assert self._active_app is not None, "no active Rex application"
        return self._active_app


get_rex = RexContext()


