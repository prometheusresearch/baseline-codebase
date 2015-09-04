#
# Copyright (c) 2014, Prometheus Research, LLC
#

import sys

from rex.core import Error, AnyVal
from rex.ctl import Task, RexTask, argument, option

from .errors import ValidationError
from .interface import CalculationSet
from .output import dump_calculationset_json, dump_calculationset_yaml
from .util import get_implementation
from .ctl import ImplementationContextReceiver


__all__ = (
    'CalculationSetValidateTask',
    'CalculationSetFormatTask',
    'CalculationSetRetrieveTask',
    'CalculationSetStoreTask',
)


def open_and_validate(
        filename,
        instrument_definition=None,
        instrument_file=None):

    try:
        definition = open(filename, 'r').read()
    except Exception as exc:
        raise Error('Could not open "%s": %s' % (
            filename,
            str(exc),
        ))

    if (not instrument_definition) and instrument_file:
        try:
            instrument_definition = AnyVal().parse(
                open(instrument_file, 'r').read()
            )
        except Exception as exc:
            raise Error('Could not open "%s": %s' % (
                instrument_file,
                str(exc),
            ))

    try:
        definition = AnyVal().parse(definition)
        CalculationSet.validate_definition(
            definition,
            instrument_definition=instrument_definition,
        )
    except ValidationError as exc:
        raise Error(exc.message)

    return definition


class CalculationSetValidateTask(Task):
    """
    validate a Common CalculationSet Definition

    The calculationset-validate task will validate the structure and content of
    the Common CalculationSet Definition in a file and report back if
    any errors are found.

    The definition is the path to the file containing the Common CalculationSet
    Definition to validate.
    """

    name = 'calculationset-validate'

    class arguments(object):  # noqa
        definition = argument(str)

    class options(object):  # noqa
        instrument = option(
            None,
            str,
            default=None,
            value_name='FILE',
            hint='the file containing the associated Instrument Definition;'
            ' if not specified, then the CalculationSet will only be'
            ' checked for schema violations',
        )

    def __call__(self):
        open_and_validate(
            self.definition,
            instrument_file=self.instrument,
        )

        print '"%s" contains a valid Common CalculationSet Definition.\n' % (
            self.definition,
        )


def output_forms(val):
    val = val.upper()
    if val in ('JSON', 'YAML'):
        return val
    raise ValueError('Invalid format type "%s" specified' % val)


class CalculationSetOutputter(object):
    class options(object):  # noqa
        output = option(
            None,
            str,
            default=None,
            value_name='OUTPUT_FILE',
            hint='the file to write to; if not specified, stdout is used',
        )
        format = option(
            None,
            output_forms,
            default='JSON',
            value_name='FORMAT',
            hint='the format to output the definition in; can be either JSON'
            ' or YAML; if not specified, defaults to JSON',
        )
        pretty = option(
            None,
            bool,
            hint='if specified, the outputted definition will be formatted'
            ' with newlines and indentation',
        )

    def do_output(self, structure):
        if self.output:
            try:
                output = open(self.output, 'w')
            except Exception as exc:
                raise Error('Could not open "%s" for writing: %s' % (
                    self.output,
                    str(exc),
                ))
        else:
            output = sys.stdout

        if self.format == 'JSON':
            output.write(
                dump_calculationset_json(
                    structure,
                    pretty=self.pretty,
                )
            )
        elif self.format == 'YAML':
            output.write(
                dump_calculationset_yaml(
                    structure,
                    pretty=self.pretty,
                )
            )

        output.write('\n')


class CalculationSetFormatTask(RexTask, CalculationSetOutputter):
    """
    render a Common CalculationSet Definition into various formats

    The calculationset-format task will take an input Common CalculationSet
    Definition file and output it as either JSON or YAML.

    The definition is the path to the file containing the Common CalculationSet
    Definition to format.
    """

    name = 'calculationset-format'

    class arguments(object):  # noqa
        definition = argument(str)

    def __call__(self):
        definition = open_and_validate(self.definition)
        self.do_output(definition)


class CalculationSetStoreTask(RexTask, ImplementationContextReceiver):
    """
    stores an CalculationSet in the data store

    The calculationset-store task will write a Common CalculationSet Definition
    file to an CalculationSet in the project's data store.

    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist the task fails.

    The definition is the path to the file containing the Common
    CalculationSet Definition to use.
    """

    name = 'calculationset-store'

    class arguments(object):  # noqa
        instrument_uid = argument(str)
        definition = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version of Instrument to store the CalculationSet in;'
            ' if not specified, one will be calculated',
        )

    def __call__(self):
        with self.make():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise Error('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            print 'Using Instrument: %s' % instrument

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise Error('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            print 'Instrument Version: %s' % instrument_version.version

            definition = open_and_validate(
                self.definition,
                instrument_definition=instrument_version.definition,
            )

            calculationset_impl = get_implementation('calculationset')
            calculationset = calculationset_impl.find(
                instrument_version=instrument_version.uid,
                limit=1
            )

            if calculationset:
                calculationset[0].definition = definition
                calculationset[0].save()
                print 'Updated existing CalculationSet'
            else:
                calculationset = calculationset_impl.create(
                    instrument_version,
                    definition,
                    implementation_context=self.get_context(
                        calculationset_impl,
                        calculationset_impl.CONTEXT_ACTION_CREATE,
                    ),
                )
                print 'Created new CalculationSet'


class CalculationSetRetrieveTask(RexTask, CalculationSetOutputter):
    """
    retrieves an CalculationSet from the datastore

    The calculation-retrieve task will retrieve an CalculationSet from a
    project's data store and return the Common CalculationSet Definition.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    """

    name = 'calculationset-retrieve'

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
            calculationset_impl = get_implementation('calculationset')
            calculationset = calculationset_impl.find(
                instrument_version=instrument_version.uid,
                limit=1
            )
            if calculationset:
                calculationset = calculationset[0]
            else:
                raise Error(
                    'No CalculationSet exists for Instrument "%s", Version %s'
                    % (
                        instrument.uid,
                        instrument_version.version,
                    )
                )

            self.do_output(calculationset.definition)

