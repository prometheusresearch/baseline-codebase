#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .context import get_rex
from .cache import Cache
from .package import get_packages
from .setting import get_settings
from .wsgi import get_wsgi
from .error import Error


class Rex(object):
    """
    Creates a Rex application.

    `requirements`
        Packages to include.  Each requirement is one of:

        * a :class:`.Package` object;
        * a requirement specification in format understood by ``setuptools``;
        * a module name;
        * a path to a directory (must end with ``/``).

    `parameters`
        Setting values.
    """

    def __init__(self, *requirements, **parameters):
        self.requirements = requirements
        self.parameters = parameters
        self.cache = Cache()
        self._setup()

    def _setup(self):
        # Fail early if there are any problems with packages or configuration.
        with self:
            try:
                get_packages()
                get_settings()
                get_wsgi()
            except Error, error:
                if self.requirements:
                    error.wrap("While initializing Rex application:",
                               "\n".join(str(requirement)
                                         for requirement in self.requirements))
                else:
                    error.wrap("While initializing Rex application")
                if self.parameters:
                    error.wrap("With parameters:",
                               "\n".join("%s: %r" % (key, self.parameters[key])
                                         for key in sorted(self.parameters)))
                raise

    def on(self):
        """
        Activates the application.

        You can also apply ``with`` statement on the application object to make
        the application active while the ``with`` block is executed.
        """
        get_rex.push(self)

    def off(self):
        """
        Deactivates the application.
        """
        get_rex.pop(self)

    def __enter__(self):
        self.on()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        self.off()

    def __call__(self, environ, start_response):
        """
        WSGI entry point.
        """
        with self:
            wsgi = get_wsgi()
            output = wsgi(environ, start_response)
            try:
                for chunk in output:
                    yield chunk
            finally:
                if hasattr(output, 'close'):
                    output.close()

    def __repr__(self):
        args = ["%r" % item for item in self.requirements] + \
               ["%s=%r" % (key, self.parameters[key])
                for key in sorted(self.parameters)]
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


