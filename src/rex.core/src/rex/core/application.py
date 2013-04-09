#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .context import active_app
from .cache import Cache
from .package import PackageCollection
from .setting import SettingCollection
from .error import Error


class RexApp(object):

    def __init__(self, *requirements, **parameters):
        try:
            self.cache = Cache()
            self.packages = PackageCollection.build(requirements)
            self.settings = None
            with self:
                self.settings = SettingCollection.build(parameters)
        except Error, error:
            error.wrap("While initializing Rex application:",
                       ", ".join(requirements) or 'rex.core')
            error.wrap("With parameters:",
                       "".join("%s: %r\n" % (key, parameters[key])
                               for key in sorted(parameters)))
            raise

    def __enter__(self):
        active_app.push(self)

    def __exit__(self, exc_type, exc_value, exc_traceback):
        active_app.pop()


