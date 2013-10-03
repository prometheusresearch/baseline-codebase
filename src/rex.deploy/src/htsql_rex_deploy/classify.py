#
# Copyright (c) 2013, Prometheus Research, LLC
#


from htsql.core.classify import CallColumn


class DeployCallColumn(CallColumn):

    def __call__(self):
        name = self.arc.column.name
        if not (name == u'id' or name.endswith(u'_id')):
            for name, weight in super(DeployCallColumn, self).__call__():
                yield name, weight


