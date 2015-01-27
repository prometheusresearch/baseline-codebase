#
# Copyright (c) 2014, Prometheus Research, LLC
#


import sys

from rex.core import Error, AnyVal
from rex.ctl import Task, RexTask, argument, option
from rex.instrument.util import get_implementation

from .errors import ValidationError
from .interface import Form
from .output import dump_form_yaml, dump_form_json


__all__ = (
    'FormsValidateTask',
    'FormsRetrieveTask',
    'FormsStoreTask',
)


# pylint: disable=E1101,C0103


def open_and_validate(
        filename,
        instrument_definition=None,
        instrument_file=None):
    try:
        configuration = open(filename, 'r').read()
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
        configuration = AnyVal().parse(configuration)
        Form.validate_configuration(
            configuration,
            instrument_definition=instrument_definition,
        )
    except ValidationError as exc:
        raise Error(exc.message)

    return configuration


class FormsValidateTask(Task):
    """
    validate a Web Form Configuration

    The forms-validate task will validate the structure and content of the Web
    Form Configuration in a file and report back if any errors are found.

    The configuration is the path to the file containing the Web Form
    Configuration to validate.
    """

    name = 'forms-validate'

    class arguments(object):  # noqa
        configuration = argument(str)

    class options(object):  # noqa
        instrument = option(
            None,
            str,
            default=None,
            value_name='FILE',
            hint='the file containing the associated Instrument Definition;'
            ' if not specified, then the Web Form Configuration will only be'
            ' checked for schema violations',
        )

    def __call__(self):
        open_and_validate(
            self.configuration,
            instrument_file=self.instrument,
        )

        print '"%s" contains a valid Web Form Configuration.\n' % (
            self.configuration,
        )


def output_forms(val):
    val = val.upper()
    if val in ('JSON', 'YAML'):
        return val
    raise ValueError('Invalid format type "%s" specified' % val)


class FormsFormatTask(Task):
    """
    render a Web Form Configuration into various formats

    The forms-format task will take an input Web Form Configuration file and
    output it as either JSON or YAML.

    The configuration is the path to the file containing the Web Form
    Configuration to format.
    """

    name = 'forms-format'

    class arguments(object):  # noqa
        configuration = argument(str)

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
            hint='the format to output the configuration in; can be either'
            ' JSON or YAML; if not specified, defaults to JSON',
        )
        pretty = option(
            None,
            bool,
            hint='if specified, the outputted configuration will be formatted'
            ' with newlines and indentation',
        )

    def __call__(self):
        configuration = open_and_validate(self.configuration)

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
                dump_form_json(
                    configuration,
                    pretty=self.pretty,
                )
            )
        elif self.format == 'YAML':
            output.write(
                dump_form_yaml(
                    configuration,
                    pretty=self.pretty,
                )
            )

        output.write('\n')


class FormsRetrieveTask(RexTask):
    """
    retrieves a Form from the datastore

    The forms-retrieve task will retrieve a Form from a project's data store
    and return the Web Form Configuration.

    The instrument-uid argument is the UID of the desired Instrument in the
    data store.

    The channel-uid argument is the UID of the Channel that the Form is
    assigned to.
    """

    name = 'forms-retrieve'

    class arguments(object):  # noqa
        instrument_uid = argument(str)
        channel_uid = argument(str)

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
        format = option(
            None,
            output_forms,
            default='JSON',
            value_name='FORMAT',
            hint='the format to output the configuration in; can be either'
            ' JSON or YAML; if not specified, defaults to JSON',
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

            channel_impl = get_implementation('channel', package_name='forms')
            channel = channel_impl.get_by_uid(self.channel_uid)
            if not channel:
                raise Error('Channel "%s" does not exist.' % (
                    self.channel_uid,
                ))

            form_impl = get_implementation('form', package_name='forms')
            form = form_impl.find(
                instrument_version=instrument_version,
                channel=channel,
                limit=1
            )
            if form:
                form = form[0]
            else:
                raise Error(
                    'No Form exists for Instrument "%s", Version %s,'
                    ' Channel "%s"' % (
                        instrument.uid,
                        instrument_version.version,
                        channel.uid,
                    )
                )

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
                    dump_form_json(
                        form.configuration,
                        pretty=self.pretty,
                    )
                )
            elif self.format == 'YAML':
                output.write(
                    dump_form_yaml(
                        form.configuration,
                        pretty=self.pretty,
                    )
                )

            output.write('\n')


class FormsStoreTask(RexTask):
    """
    stores a Form in the data store

    The forms-store task will write a Web Form Configuration file to a Form in
    the project's data store.

    The instrument-uid argument is the UID of the desired Instrument that the
    Form will be associated with.

    The channel-uid argument is the UID of the Channel that the Form will be
    associated with.

    The configuration is the path to the file containing the Web Form
    Configuration to use.
    """

    name = 'forms-store'

    class arguments(object):  # noqa
        instrument_uid = argument(str)
        channel_uid = argument(str)
        configuration = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version of the Instrument to associate the Form with; if'
            ' not specified, then the latest version will be used',
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

            configuration = open_and_validate(
                self.configuration,
                instrument_definition=instrument_version.definition,
            )

            channel_impl = get_implementation('channel', package_name='forms')
            channel = channel_impl.get_by_uid(self.channel_uid)
            if not channel:
                raise Error('Channel "%s" does not exist.' % (
                    self.channel_uid,
                ))
            print 'Using Channel: %s' % channel

            form_impl = get_implementation('form', package_name='forms')
            form = form_impl.find(
                instrument_version=instrument_version,
                channel=channel,
                limit=1
            )
            if form:
                form[0].configuration = configuration
                form[0].save()
                print 'Updated existing Form'
            else:
                form = form_impl.create(
                    channel,
                    instrument_version,
                    configuration,
                )
                print 'Created new Form'

