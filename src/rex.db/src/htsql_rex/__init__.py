#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the RexDB platform:

``/describe()``
    Produces product metadata.
"""



from htsql.core.addon import Addon
import cmd


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the RexDB platform"""
    help = __doc__


