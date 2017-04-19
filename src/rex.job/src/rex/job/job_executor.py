#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import Extension
from rex.db import get_db
from rex.logging import get_logger


__all__ = (
    'JobExecutor',
)


HTSQL_FACET_TEMPLATE = '''
/merge(%(table_name)s := {
    id($job) :as job,
    %(fields)s
})
'''


class JobExecutor(Extension):
    """
    This is an extension that allows the creation of custom "Jobs" that are
    executed via the rex.jobs infrastructure.
    """

    #: The name of the job as referred to in the "type" column of the job table
    name = None

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            assert cls.execute != JobExecutor.execute, \
                '%s.execute() method not implemented' % cls

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def __init__(self):
        self.logger = get_logger(self)

    def execute(self, code, owner, payload):
        """
        Called when a Job is being executed.

        Must be implemented by concrete classes.

        :param code: the unique identifier of the Job
        :type code: int
        :param owner: the owner of the Job
        :type owner: str
        :param payload: the payload of the Job
        :type payload: dict
        """

        raise NotImplementedError()

    def update_facet(self, name, code, **fields):
        """
        A convenience method for updating fields on a job record's facet.

        :param name: the name of the ``job`` facet table to update
        :type name: str
        :param code: the unique identifier of the Job record to update
        :type code: int
        :param fields: the fields on the facet to update
        """
        # pylint: disable=no-self-use

        query = HTSQL_FACET_TEMPLATE % {
            'table_name': name,
            'fields': ', '.join([
                '$%s :as %s' % (field_name, field_name)
                for field_name in fields.keys()
            ]),
        }

        get_db().produce(query, job=code, **fields)

