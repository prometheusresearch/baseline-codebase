#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


import threading


class RexContext(threading.local):
    """
    Returns the current active application.

    When used as a condition, returns ``True`` if there is an active
    application; ``False``, otherwise.

    The active application is thread-local so that each thread of the
    process may have its own active application.
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
        assert self._active_app is app, "unexpected RexDB application"
        self._active_app = self._app_stack.pop()

    def __call__(self):
        # Returns the current active application.
        assert self._active_app is not None, "no active RexDB application"
        return self._active_app

    def __bool__(self):
        return (self._active_app is not None)


get_rex = RexContext()


