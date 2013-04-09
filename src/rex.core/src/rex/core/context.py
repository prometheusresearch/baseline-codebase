#
# Copyright (c) 2013, Prometheus Research, LLC
#


import threading


class RexAppContext(threading.local):
    """Holds attributes of the active Rex application in the current thread."""

    def __init__(self):
        self._active_app = None
        self._app_stack = []

    def push(self, app):
        self._app_stack.append(self._active_app)
        self._active_app = app

    def pop(self):
        self._active_app = self._app_stack.pop()

    def __call__(self):
        if self._active_app is None:
            raise RuntimeError("Active Rex application is not set")
        return self._active_app

    @property
    def cache(self):
        return self().cache

    @property
    def packages(self):
        return self().packages

    @property
    def settings(self):
        return self().settings


active_app = RexAppContext()


