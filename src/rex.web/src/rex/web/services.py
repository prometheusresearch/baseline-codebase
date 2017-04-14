#
# Copyright (c) 2017, Prometheus Research, LLC
#


from rex.core import Setting, StrVal, SeqVal


class ServicesSetting(Setting):
    """
    Services to run alongside the web server.
    """

    name = 'services'
    default = []
    validate = SeqVal(StrVal)

    def merge(self, old, new):
        if isinstance(old, list) and isinstance(new, list):
            return old + new
        return new


