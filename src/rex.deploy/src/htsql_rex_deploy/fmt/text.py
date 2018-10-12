#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.fmt.text import ToText
from ..domain import JSONDomain


class JSONToText(ToText):

    adapt(JSONDomain)

    def widths(self, data):
        if data is None:
            return [0]
        text = self.domain.dump(data)
        max_width = 0
        for line in text.splitlines():
            if len(line) > max_width:
                max_width = len(line)
        return [max_width]

    def body(self, data, widths):
        [width] = widths
        if data is None:
            yield [(" "*width, False)]
            return
        text = self.domain.dump(data)
        is_first = True
        for line in text.splitlines():
            yield [("%*s" % (-width, line), is_first)]
            is_first = False


