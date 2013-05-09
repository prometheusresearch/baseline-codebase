from rexrunner.registry import register_parameter, register_handler
from rexrunner.validator import BoolVal, DirVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
# from rex.forms import InstrumentsPackageHandler
from .command import *

import errno

@register_parameter
class ManualEditConditions(Parameter):
    """
    Boolean parameter that specifies if it is allowed to manually edit
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal(is_nullable=False)
    default = False

@register_parameter
class FormBuilderInstrumentDir(Parameter):
    """
    Directory which stores instruments

    Example:
      formbuilder_instruments: /path/to/instruments
    """
    name = 'formbuilder_instruments'
    validator = DirVal(is_nullable=False)

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
