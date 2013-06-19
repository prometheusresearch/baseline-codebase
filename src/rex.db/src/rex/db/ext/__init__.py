#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
The ``rex`` HTSQL addon registers extensions specific to the Rex platform:

``/describe()``
    Produces product metadata.
"""



from htsql.core.addon import Addon
import cmd


class RexAddon(Addon):

    name = 'rex'
    hint = """HTSQL extensions for the Rex platform"""
    help = __doc__


