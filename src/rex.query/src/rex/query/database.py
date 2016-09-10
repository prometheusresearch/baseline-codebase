#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.db import get_db
from .query import QueryVal
from .bind import RexBindingState
from htsql import HTSQL
from htsql.core.tr.translate import translate


class Database(object):

    def __init__(self, db=None):
        if not isinstance(db, HTSQL):
            db = get_db(db)
        self.db = db

    parse = QueryVal()

    def translate(self, query):
        query = self.parse(query)
        with self.db:
            state = RexBindingState()
            binding = state(query)
            plan = translate(binding, limit=query.limit, offset=query.offset)
        return plan

    def produce(self, query):
        query = self.parse(query)
        pipe = self.translate(query)
        with self.db:
            return pipe()(None)


