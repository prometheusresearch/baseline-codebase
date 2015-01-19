#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.connect import Scramble, Unscramble
from .domain import JSONDomain
import json


class ScrambleJSON(Scramble):

    adapt(JSONDomain)

    @staticmethod
    def convert(value):
        if value is None:
            return None
        return json.dumps(
                value, indent=2, separators=(',', ': '), sort_keys=True)


class UnscrambleJSON(Unscramble):

    adapt(JSONDomain)

    @staticmethod
    def convert(value):
        if isinstance(value, (str, unicode)):
            value = json.loads(value)
        return value


