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

    def __init__(self, *requirements, **parameters):
        self.requirements = requirements
        self.parameters = parameters
        self.cache = Cache()
        self._prepare()

    def _prepare(self):
        with self:
            try:
                get_packages()
                get_settings()
                get_wsgi()
            except Error, error:
                error.wrap("While initializing Rex application:",
                           ", ".join(self.requirements) or 'rex.core')
                error.wrap("With parameters:",
                           "".join("%s: %r\n" % (key, self.parameters[key])
                                   for key in sorted(self.parameters)))
                raise

    def __enter__(self):
        get_rex.push(self)

    def __exit__(self, exc_type, exc_value, exc_traceback):
        get_rex.pop()

    def __call__(self, environ, start_response):
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


