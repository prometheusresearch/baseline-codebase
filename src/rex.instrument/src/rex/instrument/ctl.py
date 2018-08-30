#
# Copyright (c) 2014, Prometheus Research, LLC
#


import sys

from getpass import getuser

from rex.core import Error, AnyVal
from rex.ctl import Task, RexTask, argument, option, log
from rex.ctl.common import pair

from .interface import InstrumentVersion
from .output import dump_instrument_json, dump_instrument_yaml
from .util import get_implementation, get_current_datetime


__all__ = (
    'InstrumentValidateTask',
    'InstrumentFormatTask',
    'InstrumentRetrieveTask',
    'InstrumentStoreTask',
)


def open_and_validate(filename):
    try:
        definition = open(filename, 'r').read()
    except Exception as exc:
        raise Error('Could not open "%s": %s' % (
            filename,
            str(exc),
        ))

    definition = AnyVal().parse(definition)
    InstrumentVersion.validate_definition(definition)

    return definition


class InstrumentValidateTask(Task):
    """
    validate a Common Instrument Definition

    The instrument-validate task will validate the structure and content of the
    Common Instrument Definition in a file and report back if
    any errors are found.

    The definition is the path to the file containing the Common Instrument
    Definition to validate.
    """

    name = 'instrument-validate'

    class arguments(object):  # noqa
        definition = argument(str)

    def __call__(self):
        open_and_validate(self.definition)

        log('"%s" contains a valid Common Instrument Definition.\n' % (
            self.definition,
        ))


def output_forms(val):
    val = val.upper()
    if val in ('JSON', 'YAML'):
        return val
    raise ValueError('Invalid format type "%s" specified' % val)


class InstrumentOutputter(object):
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
                dump_instrument_json(
                    structure,
                    pretty=self.pretty,
                )
            )
        elif self.format == 'YAML':
            output.write(
                dump_instrument_yaml(
                    structure,
                    pretty=self.pretty,
                )
            )

        output.write('\n')


class InstrumentFormatTask(Task, InstrumentOutputter):
    """
    render a Common Instrument Definition into various formats

    The instrument-format task will take an input Common Instrument Definition
    file and output it as either JSON or YAML.

    The definition is the path to the file containing the Common Instrument
    Definition to format.
    """

    name = 'instrument-format'

    class arguments(object):  # noqa
        definition = argument(str)

    def __call__(self):
        definition = open_and_validate(self.definition)
        self.do_output(definition)


class InstrumentRetrieveTask(RexTask, InstrumentOutputter):
    """
    retrieves an InstrumentVersion from the datastore

    The instrument-retrieve task will retrieve an InstrumentVersion from a
    project's data store and return the Common Instrument Definition.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    """

    name = 'instrument-retrieve'

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

            self.do_output(instrument_version.definition)


class ImplementationContextReceiver(object):
    class options(object):  # noqa
        context = option(
            None,
            pair,
            default=(),
            plural=True,
            value_name='PARAM=VALUE',
            hint='the additional parameters to pass to the RexAcquire API'
            ' implementations to create/save objects to the data store',
        )

    def get_context(self, impl, action):
        context = {}
        received = dict(self.context)
        spec = impl.get_implementation_context(action)
        for name, _ in list(spec.items()):
            if name in received:
                context[name] = received[name]
        return context


class InstrumentStoreTask(RexTask, ImplementationContextReceiver):
    """
    stores an InstrumentVersion in the data store

    The instrument-store task will write a Common Instrument Definition file to
    an InstrumentVersion in the project's data store.

    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist, a new Instrument will be
    created using that UID.

    The definition is the path to the file containing the Common
    Instrument Definition to use.
    """

    name = 'instrument-store'

    class arguments(object):  # noqa
        instrument_uid = argument(str)
        definition = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version to store the InstrumentVersion as; if not'
            ' specified, one will be calculated',
        )
        title = option(
            None,
            str,
            default=None,
            value_name='TITLE',
            hint='the title to give the Instrument, if one is being created;'
            ' if not specified, the instrument UID will be used',
        )
        published_by = option(
            None,
            str,
            default=getuser(),
            value_name='NAME',
            hint='the name to record as the publisher of the'
            ' InstrumentVersion; if not specified, the username of the'
            ' executing user will be used',
        )

    def __call__(self):
        with self.make():
            definition = open_and_validate(self.definition)
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)

            if not instrument:
                log('An Instrument by "%s" does not exist; creating it.' % (
                    self.instrument_uid,
                ))
                instrument = instrument_impl.create(
                    self.instrument_uid,
                    self.title or self.instrument_uid,
                    implementation_context=self.get_context(
                        instrument_impl,
                        instrument_impl.CONTEXT_ACTION_CREATE,
                    ),
                )
            log('Using Instrument: %s' % instrument)

            instrumentversion_impl = \
                get_implementation('instrumentversion')

            if self.version:
                instrument_version = instrument.get_version(self.version)
                if instrument_version:
                    instrument_version.definition = definition
                    instrument_version.published_by = self.published_by
                    instrument_version.date_published = get_current_datetime()
                    instrument_version.save()
                    log('Updated version: %s' % instrument_version.version)
                else:
                    instrument_version = instrumentversion_impl.create(
                        instrument,
                        definition,
                        self.published_by,
                        version=self.version,
                        implementation_context=self.get_context(
                            instrumentversion_impl,
                            instrumentversion_impl.CONTEXT_ACTION_CREATE,
                        ),
                    )
                    log('Created version: %s' % instrument_version.version)
            else:
                instrument_version = instrumentversion_impl.create(
                    instrument,
                    definition,
                    self.published_by,
                    implementation_context=self.get_context(
                        instrumentversion_impl,
                        instrumentversion_impl.CONTEXT_ACTION_CREATE,
                    ),
                )
                log('Created version: %s' % instrument_version.version)

