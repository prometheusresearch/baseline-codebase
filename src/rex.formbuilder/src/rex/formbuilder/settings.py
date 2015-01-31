#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error, Setting, StrVal
import os

__all__ = (
    'FormbuilderDraftCacheSetting',
)


class FormbuilderDraftCacheSetting(Setting):
    """
    This setting is used to define a directory where the draft cache
    will store its files

    Example::

        formbuilder_draft_cache: /path/to/cache/dir
    """

    name = 'formbuilder_draft_cache'

    def default(self):
        return self.validate(None)

    def validate(self, value):
        if value is None:
            return None
        value = StrVal()(value)
        if not os.path.isdir(value):
            raise Error("Non-existing path for `formbuilder_draft_cache`: %s", value)
        return value

