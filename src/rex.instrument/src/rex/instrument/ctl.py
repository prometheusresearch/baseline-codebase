#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import sys

from getpass import getuser

from rex.core import Error
from rex.ctl import Task, RexTask, argument, option

from .errors import ValidationError
from .interface import InstrumentVersion
from .util import get_implementation, get_current_datetime


__all__ = (
    'InstrumentValidateTask',
    'InstrumentRetrieveTask',
    'InstrumentStoreTask',
)


# pylint: disable=E1101,C0103


def open_and_validate(filename):
    try:
        definition = open(filename, 'r').read()
    except Exception as exc:
        raise Error('Could not open "%s": %s' % (
            filename,
            str(exc),
        ))

    try:
        InstrumentVersion.validate_definition(definition)
    except ValidationError as exc:
        raise Error(exc.message)

    return definition


class InstrumentValidateTask(Task):
    """
    validate a Common Instrument Definition

    The instrument-validate task will validate the structure and content of the
    Common Instrument Definition in a JSON file and report back if any errors
    are found.

    The only argument to this task is the filename to validate.
    """

    name = 'instrument-validate'

    class arguments(object):  # noqa
        definition = argument(str)

    def __call__(self):
        open_and_validate(self.definition)

        print '"%s" contains a valid Common Instrument Definition.\n' % (
            self.definition,
        )


class InstrumentRetrieveTask(RexTask):
    """
    retrieves an InstrumentVersion from the datastore

    The instrument-retrieve task will retrieve an InstrumentVersion from a
    project's data store and return the Common Instrument Definition JSON.

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
        output = option(
            None,
            str,
            default=None,
            value_name='OUTPUT_FILE',
            hint='the file to write the JSON to; if not specified, stdout is'
            ' used',
        )
        pretty = option(
            None,
            bool,
            hint='if specified, the outputted JSON will be formatted with'
            ' newlines and indentation',
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

            output.write(
                json.dumps(
                    instrument_version.definition,
                    ensure_ascii=False,
                    indent=2 if self.pretty else None,
                )
            )
            output.write('\n')


class InstrumentStoreTask(RexTask):
    """
    stores an InstrumentVersion in the data store

    The instrument-store task will write a Common Instrument Definition JSON
    file to an InstrumentVersion in the project's data store.

    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist, a new Instrument will be
    created using that UID.

    The definition is the path to the JSON file containing the Common
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
            definition_json = open_and_validate(self.definition)

            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                print 'An Instrument by "%s" does not exist; creating it.' % (
                    self.instrument_uid,
                )
                instrument = instrument_impl.create(
                    self.instrument_uid,
                    self.title or self.instrument_uid,
                )
            print 'Using Instrument: %s' % instrument

            instrumentversion_impl = \
                get_implementation('instrumentversion')

            if self.version:
                instrument_version = instrument.get_version(self.version)
                if instrument_version:
                    instrument_version.definition_json = definition_json
                    instrument_version.published_by = self.published_by
                    instrument_version.date_published = get_current_datetime()
                    instrument_version.save()
                    print 'Updated version: %s' % instrument_version.version
                else:
                    instrument_version = instrumentversion_impl.create(
                        instrument,
                        definition_json,
                        self.published_by,
                        version=self.version,
                    )
                    print 'Created version: %s' % instrument_version.version
            else:
                instrument_version = instrumentversion_impl.create(
                    instrument,
                    definition_json,
                    self.published_by,
                )
                print 'Created version: %s' % instrument_version.version

