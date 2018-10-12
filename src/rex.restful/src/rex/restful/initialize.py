#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Initialize, get_settings, Error

from .command import RestfulLocation


__all__ = (
    'RestfulInitialize',
)


class RestfulInitialize(Initialize):
    @classmethod
    def signature(cls):  # pragma: no cover
        return 'restful'

    def __call__(self):
        # Make sure the CORS policies specified by all the RestfulLocations
        # are actually defined.
        configured_policies = list(get_settings().restful_cors_policies.keys())
        for cls in RestfulLocation.all():
            if issubclass(cls, RestfulLocation) and cls.cors_policy:
                if cls.cors_policy not in configured_policies:
                    raise Error(
                        'No policy named "%s" defined in restful_cors_policies'
                        ' setting' % (
                            cls.cors_policy,
                        ),
                    )

