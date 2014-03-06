#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the RexDB platform:
none so far.
"""


from htsql.core.addon import Addon


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the RexDB platform"""
    help = __doc__


