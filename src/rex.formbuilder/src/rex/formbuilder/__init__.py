from rex.core import Setting, BoolVal, StrVal
from .command import *

import errno

class ManualEditConditions(Setting):
    """
    Boolean parameter that specifies if it is allowed to manually edit
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal()
    default = False

class FormBuilderInstrumentDir(Setting):
    """
    Directory which stores instruments

    Example:
      formbuilder_instruments: /path/to/instruments
    """
    name = 'formbuilder_instruments'
    validator = StrVal()

"""
@register_handler
class FormBuilderPackageHandler(PackageHandler):

    def __init__(self, app, package):
        self.instrument_dir = app.config.formbuilder_instruments
        super(FormBuilderPackageHandler, self).__init__(app, package)

    def instrument_filename(self, instrument):
        return "%s/%s.json" % (self.instrument_dir, instrument)

    def save_instrument(self, instrument, code):
        try:
            filename = self.instrument_filename(instrument)
            with open(filename, 'w') as f:
                f.write(code)
            return True
        except IOError as e:
            pass
        return False

    def get_latest_instrument(self, instrument):
        try:
            filename = self.instrument_filename(instrument)
            with open(filename, 'r') as f:
                return (f.read(), 0)
        except IOError as e:
            if e.errno == errno.ENOENT:
                raise BadRequestError(detail='No such instrument: %s' % instrument)
            raise
"""
