#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.util import maybe, oneof
from htsql.core.domain import Domain
import json


class JSONDomain(Domain):

    @staticmethod
    def parse(text):
        assert isinstance(text, maybe(str))
        if text is None:
            return None
        return json.loads(text)

    @staticmethod
    def dump(data):
        assert isinstance(data, maybe(oneof(bool, str, str,
                                            int, int, float, list, dict)))
        if data is None:
            return None
        return str(json.dumps(
                    data, indent=2, separators=(',', ': '), sort_keys=True))


