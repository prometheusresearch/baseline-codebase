"""

    rex.graphql.multidispatch
    =========================

    A simple implementation of multidispatch.

    :copyright: 2019-present Prometheus Research, LLC

"""


class multidispatch:
    def __init__(self, default):
        self.default = default
        self.by_type = {}

    def for_type(self, type):
        def register(f):
            assert type not in self.by_type
            self.by_type[type] = f
            return self

        return register

    def __call__(self, arg, *args, **kwargs):
        f = self.by_type.get(type(arg))
        if f is None:
            return self.default(arg, *args, **kwargs)
        else:
            return f(arg, *args, **kwargs)
