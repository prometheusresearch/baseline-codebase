#
# Copyright (c) 2016, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Setting, MapVal, StrVal, RecordVal, SeqVal, MaybeVal, \
    IntVal, BoolVal


__all__ = (
    'CorsPoliciesSetting',
    'EmulateSlownessSetting',
)


class CorsPoliciesSetting(Setting):
    """
    A mapping of identifiers to CORS policy configurations. These identifiers
    are used by implementations of the RestfulLocation extension to indiciate
    what CORS policy to apply to the endpoint.

    These configurations are mappings that can contain the following
    properties:

    * allow_origins: A list of the Origin URLs that are allowed to access this
      endpoint. If not specified, defaults to ``*``, which allows all URLs.
    * allow_methods: A list of the HTTP methods that are allowed on this
      endpoint. If not specified, defaults to all methods implmented on the
      endpoint.
    * allow_headers: A list of the HTTP Headers that are allowed on this
      endpoint. If not specified, defaults to allowing all headers.
    * max_age: The maximum time (in seconds) that clients should cache
      preflight results. If not specified, defaults to no limit.
    * vary: A boolean indiciating whether or not to set the Vary header for
      Origin. If not specified, False will be used for policies allowing any
      Origin, and True will be used for policies that specify Origins.
    * allow_non_cors: A boolean indicating whether or not non-CORS requests
      should be allowed. If not specified, defaults to True.
    """

    #:
    name = 'restful_cors_policies'

    default = {}

    validate = MapVal(
        StrVal(),
        RecordVal(
            ('allow_origins', MaybeVal(SeqVal(StrVal())), None),
            ('allow_methods', MaybeVal(SeqVal(StrVal())), None),
            ('allow_headers', MaybeVal(SeqVal(StrVal())), None),
            ('max_age', MaybeVal(IntVal()), None),
            ('vary', MaybeVal(BoolVal()), None),
            ('allow_non_cors', MaybeVal(BoolVal()), None),
        ),
    )

    def merge(self, old_value, new_value):
        merged = deepcopy(old_value)
        for key, value in list(new_value.items()):
            if key not in merged:
                merged[key] = value
            else:
                if isinstance(merged[key], dict) and isinstance(value, dict):
                    merged[key] = self.merge(merged[key], value)
                else:
                    merged[key] = value
        return merged


class EmulateSlownessSetting(Setting):
    """
    This is a development setting that will intentionally slow down the
    execution of every endpoint by the number of milliseconds specified in this
    setting.

    This is particularly useful when developing a GUI that directly invokes
    restful endpoints and you want to test the behavior of the GUI when the
    server takes a long time to respond.

    If not specified, defaults to ``0``.
    """

    #:
    name = 'restful_emulate_slowness'
    validate = IntVal(0)
    default = 0

