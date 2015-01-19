#
# Copyright (c) 2006-2013, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.domain import Domain
from htsql.core.tr.dump import DumpToDomain
from ..domain import JSONDomain


class DumpToJSON(DumpToDomain):

    adapt(Domain, JSONDomain)

    def __call__(self):
        self.format("CAST ({base} AS JSON)", base=self.base)


