#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import sys

from datetime import datetime
from getpass import getuser

from cogs import task, argument, option
from cogs.log import fail

from rex.ctl.common import make_rex, pair

from .errors import ValidationError
from .interface import InstrumentVersion
from .util import get_implementation


__all__ = (
    'INSTRUMENT_VALIDATE',
    'INSTRUMENT_RETRIEVE',
    'INSTRUMENT_STORE',
)


# pylint: disable=C0103


class InstrumentTaskTools(object):
    """
    This is a mixin class containing utility functions for the rex.instrument
    rex.ctl tasks.
    """

    def open_and_validate(self, filename):
        try:
            definition = open(filename, 'r').read()
        except Exception as exc:
            raise fail('Could not open "%s": %s' % (
                filename,
                str(exc),
            ))

        try:
            InstrumentVersion.validate_definition(definition)
        except ValidationError as exc:
            raise fail(exc.message)

        return definition


@task
class INSTRUMENT_VALIDATE(InstrumentTaskTools):
    """
    validate a Common Instrument Definition

    The instrument-validate task will validate the structure and content of the
    Common Instrument Definition in a JSON file and report back if any errors
    are found.

    The only argument to this task is the filename to validate.
    """

    definition = argument(str)

    def __init__(self, definition):
        self.definition = definition

    def __call__(self):
        self.open_and_validate(self.definition)

        print '"%s" contains a valid Common Instrument Definition.\n' % (
            self.definition,
        )


class InstrumentInstanceTask(object):
    require = option(
        None,
        str,
        default=[],
        plural=True,
        value_name='PACKAGE',
        hint='include an additional package',
    )
    setting = option(
        None,
        pair,
        default={},
        plural=True,
        value_name='PARAM=VALUE',
        hint='set a configuration parameter',
    )

    def __init__(self, project, require, setting):
        self.project = project
        self.require = require
        self.setting = setting

    def get_rex(self):
        return make_rex(
            self.project,
            self.require,
            self.setting,
            False,
            ensure='rex.instrument',
        )


@task
class INSTRUMENT_RETRIEVE(InstrumentInstanceTask):
    """
    retrieves an InstrumentVersion from the datastore

    The instrument-retrieve task will retrieve an InstrumentVersion from a
    project's data store and return the Common Instrument Definition JSON.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    """

    instrument_uid = argument(str)
    project = argument(str, default=None)

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
        hint='the file to write the JSON to; if not specified, stdout is used',
    )
    pretty = option(
        None,
        bool,
        hint='if specified, the outputted JSON will be formatted with newlines'
        ' and indentation',
    )

    def __init__(
            self,
            instrument_uid,
            project,
            require,
            setting,
            version,
            output,
            pretty):
        super(INSTRUMENT_RETRIEVE, self).__init__(
            project,
            require,
            setting,
        )
        self.instrument_uid = instrument_uid
        self.version = version
        self.output = output
        self.pretty = pretty

    def __call__(self):
        with self.get_rex():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise fail('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise fail('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))

            if self.output:
                try:
                    output = open(self.output, 'w')
                except Exception as exc:
                    raise fail('Could not open "%s" for writing: %s' % (
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


@task
class INSTRUMENT_STORE(InstrumentInstanceTask, InstrumentTaskTools):
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

    instrument_uid = argument(str)
    definition = argument(str)
    project = argument(str, default=None)

    version = option(
        None,
        str,
        default=None,
        value_name='VERSION',
        hint='the version to store the InstrumentVersion as; if not specified,'
        ' one will be calculated',
    )

    title = option(
        None,
        str,
        default=None,
        value_name='TITLE',
        hint='the title to give the Instrument, if one is being created; if'
        ' not specified, the instrument UID will be used',
    )

    published_by = option(
        None,
        str,
        default=getuser(),
        value_name='NAME',
        hint='the name to record as the publisher of the InstrumentVersion; if'
        ' not specified, the username of the executing user will be used',
    )

    def __init__(
            self,
            instrument_uid,
            definition,
            project,
            require,
            setting,
            version,
            title,
            published_by):
        super(INSTRUMENT_STORE, self).__init__(
            project,
            require,
            setting,
        )
        self.instrument_uid = instrument_uid
        self.definition = definition
        self.version = version
        self.title = title
        self.published_by = published_by

    def __call__(self):
        with self.get_rex():

            definition_json = self.open_and_validate(self.definition)

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

            instrument_version = instrument.get_version(self.version)
            if instrument_version and self.version:
                instrument_version.definition_json = definition_json
                instrument_version.published_by = self.published_by
                instrument_version.date_published = datetime.utcnow()
                instrument_version.save()
                print 'Updated version: %s' % instrument_version.version
            else:
                instrumentversion_impl = \
                    get_implementation('instrumentversion')
                instrument_version = instrumentversion_impl.create(
                    instrument,
                    definition_json,
                    self.published_by,
                    version=self.version,
                )
                print 'Created new version: %s' % instrument_version.version

