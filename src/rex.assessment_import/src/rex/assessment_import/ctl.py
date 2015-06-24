import os
import csv
from collections import OrderedDict

from rex.core import Error
from rex.ctl import RexTask, argument, option
from rex.instrument.util import get_implementation
from .util import parse_instrument, make_template


class AssessmentExportTemplateTask(RexTask):
    """
    exports an InstrumentVersion from the datastore

    The assessment-export-template task will export an InstrumentVersion from a
    project's data store and save generated output as a bunch of csv files.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    """

    name = 'assessment-export-template'

    class arguments(object):  # noqa
        instrument_uid = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version of the Instrument to retrieve; if not specified,'
            ' defaults to the latest version',
        )
        output = option(
            None,
            str,
            default=None,
            value_name='OUTPUT_PATH',
            hint='the direcory to generated csv files write to;'
            ' if not specified, current directory is used',
        )


    def __call__(self):
        with self.make():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise Error('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise Error('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            self.do_output(instrument_version.definition)

    def do_output(self, structure):
        path = os.getcwd()
        if self.output:
            path = os.path.abspath(self.output)

        if not os.path.exists(path):
            try:
                os.mkdir(path)
            except OSError, exc:
                raise Error('Could not add output directory "%s"' % path,
                            exc)
        if not os.access(path, os.W_OK):
            raise Error('Directory "%s" is forbidden for writing' % path)
        instrument = parse_instrument(structure)
        output = make_template(instrument, instrument.id)
        for objname, template in output.items():
            filepath = os.path.join(path, '%s.csv' % objname)
            csvdata = [template.keys(), template.values()]
            with open(filepath, 'w') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=template.keys())
                writer.writeheader()
                writer.writerow(template)
