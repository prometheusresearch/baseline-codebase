#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import StrVal
from .fact import Fact
import os.path


class IncludeFact(Fact):
    """
    Loads a collection of facts from a file.

    `path`: ``str``
        Path to a file containing a collection of facts.  The file must be
        in YAML format.
    """

    fields = [
            ('include', StrVal),
    ]

    @classmethod
    def build(cls, driver, spec):
        path = spec.include
        if driver.cwd is not None:
            path = os.path.join(driver.cwd, path)
        return cls(path)

    def __init__(self, path):
        assert isinstance(path, str)
        self.path = path

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.path)

    def __call__(self, driver):
        cwd = driver.cwd
        driver.chdir(os.path.dirname(self.path))
        with open(self.path) as stream:
            driver(stream)
        driver.chdir(cwd)


