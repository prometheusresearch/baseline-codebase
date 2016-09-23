#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.core import Error, AnyVal
from rex.ctl import Task, RexTask, argument, option, log
from rex.instrument import InstrumentVersion
from rex.instrument.ctl import \
    open_and_validate as open_and_validate_instrument, \
    ImplementationContextReceiver
from rex.instrument.util import get_implementation

from .errors import ValidationError
from .interface import Interaction
from .output import dump_interaction_yaml, dump_interaction_json


__all__ = (
    'MobileValidateTask',
    'MobileFormatTask',
    'MobileRetrieveTask',
    'MobileStoreTask',
    'InstrumentMobileSkeleton',
)


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

    configuration = AnyVal().parse(configuration)
    Interaction.validate_configuration(
        configuration,
        instrument_definition=instrument_definition,
    )

    return configuration


class MobileValidateTask(Task):
    """
    validate an SMS Interaction Configuration

    The mobile-validate task will validate the structure and content of the SMS
    Interaction Configuration in a file and report back if any errors are
    found.

    The configuration is the path to the file containing the SMS Interaction
    Configuration to validate.
    """

    name = 'mobile-validate'

    class arguments(object):  # noqa
        configuration = argument(str)

    class options(object):  # noqa
        instrument = option(
            None,
            str,
            default=None,
            value_name='FILE',
            hint='the file containing the associated Instrument Definition;'
            ' if not specified, then the SMS Interaction Configuration will'
            ' only be checked for schema violations',
        )

    def __call__(self):
        open_and_validate(
            self.configuration,
            instrument_file=self.instrument,
        )

        log('"%s" contains a valid SMS Interaction Configuration.\n' % (
            self.configuration,
        ))


def output_forms(val):
    val = val.upper()
    if val in ('JSON', 'YAML'):
        return val
    raise ValueError('Invalid format type "%s" specified' % val)


class InteractionOutputter(object):
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
                dump_interaction_json(
                    structure,
                    pretty=self.pretty,
                )
            )
        elif self.format == 'YAML':
            output.write(
                dump_interaction_yaml(
                    structure,
                    pretty=self.pretty,
                )
            )

        output.write('\n')


class MobileFormatTask(Task, InteractionOutputter):
    """
    render an SMS Interaction Configuration into various formats

    The mobile-format task will take an input SMS Interaction Configuration
    file and output it as either JSON or YAML.

    The configuration is the path to the file containing the SMS Interaction
    Configuration to format.
    """

    name = 'mobile-format'

    class arguments(object):  # noqa
        configuration = argument(str)

    def __call__(self):
        configuration = open_and_validate(self.configuration)
        self.do_output(configuration)


class MobileRetrieveTask(RexTask, InteractionOutputter):
    """
    retrieves an Interaction from the datastore

    The mobile-retrieve task will retrieve an Interaction from a project's data
    store and return the SMS Interaction Configuration.

    The instrument-uid argument is the UID of the desired Instrument in the
    data store.

    The channel-uid argument is the UID of the Channel that the Interaction is
    assigned to.
    """

    name = 'mobile-retrieve'

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

            channel_impl = get_implementation('channel')
            channel = channel_impl.get_by_uid(self.channel_uid)
            if not channel:
                raise Error('Channel "%s" does not exist.' % (
                    self.channel_uid,
                ))
            if channel.presentation_type != channel_impl.PRESENTATION_TYPE_SMS:
                raise Error('Channel "%s" is not a mobile channel.' % (
                    channel.uid,
                ))

            inter_impl = get_implementation(
                'interaction',
                package_name='mobile',
            )
            interaction = inter_impl.find(
                instrument_version=instrument_version,
                channel=channel,
                limit=1
            )
            if interaction:
                interaction = interaction[0]
            else:
                raise Error(
                    'No Interaction exists for Instrument "%s", Version %s,'
                    ' Channel "%s"' % (
                        instrument.uid,
                        instrument_version.version,
                        channel.uid,
                    )
                )

            self.do_output(interaction.configuration)


class MobileStoreTask(RexTask, ImplementationContextReceiver):
    """
    stores an Interaction in the data store

    The mobile-store task will write an SMS Interaction Configuration file to
    an Interaction in the project's data store.

    The instrument-uid argument is the UID of the desired Instrument that the
    Interaction will be associated with.

    The channel-uid argument is the UID of the Channel that the Interaction
    will be associated with.

    The configuration is the path to the file containing the SMS Interaction
    Configuration to use.
    """

    name = 'mobile-store'

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
            hint='the version of the Instrument to associate the Interaction'
            ' with; if not specified, then the latest version will be used',
        )

    def __call__(self):
        with self.make():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise Error('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            log('Using Instrument: %s' % instrument)

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise Error('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            log('Instrument Version: %s' % instrument_version.version)

            configuration = open_and_validate(
                self.configuration,
                instrument_definition=instrument_version.definition,
            )

            channel_impl = get_implementation('channel')
            channel = channel_impl.get_by_uid(self.channel_uid)
            if not channel:
                raise Error('Channel "%s" does not exist.' % (
                    self.channel_uid,
                ))
            if channel.presentation_type != channel_impl.PRESENTATION_TYPE_SMS:
                raise Error('Channel "%s" is not a mobile channel.' % (
                    channel.uid,
                ))
            log('Using Channel: %s' % channel)

            inter_impl = get_implementation(
                'interaction',
                package_name='mobile',
            )
            interaction = inter_impl.find(
                instrument_version=instrument_version,
                channel=channel,
                limit=1
            )
            if interaction:
                interaction[0].configuration = configuration
                interaction[0].save()
                log('Updated existing Interaction')
            else:
                interaction = inter_impl.create(
                    channel,
                    instrument_version,
                    configuration,
                    implementation_context=self.get_context(
                        inter_impl,
                        inter_impl.CONTEXT_ACTION_CREATE,
                    ),
                )
                log('Created new Interaction')


class InstrumentMobileSkeleton(Task, InteractionOutputter):
    """
    generate a basic SMS Interaction Configuration from an Instrument
    Definintion

    The only argument to this task is the filename of the Instrument.
    """

    name = 'instrument-mobileskeleton'

    class arguments(object):  # noqa
        definition = argument(str)

    class options(object):  # noqa
        localization = option(
            None,
            str,
            default='en',
            value_name='LOCALE',
            hint='the locale to use as the default localization; if not'
            ' specified, defaults to "en"',
        )

    def __call__(self):
        instrument = open_and_validate_instrument(self.definition)

        configuration = self.make_interaction(instrument)
        try:
            # Double check what we produced to make sure it's valid.
            Interaction.validate_configuration(configuration, instrument)
        except ValidationError as exc:  # pragma: no cover
            raise Error(
                'Unable to validate interaction configuration: %s' % (exc,)
            )

        self.do_output(configuration)

    def _text(self, text):
        return {
            self.localization: text,
        }

    def make_interaction(self, instrument):
        interaction = {}

        interaction['instrument'] = {
            'id': instrument['id'],
            'version': instrument['version'],
        }

        interaction['defaultLocalization'] = self.localization

        interaction['steps'] = []

        for field in instrument['record']:
            interaction['steps'].append({
                'type': 'question',
                'options': self.make_question_options(field, instrument),
            })

        return interaction

    def make_question_options(self, field, instrument):
        opts = {
            'fieldId': field['id'],
            'text': self._text(field.get('description', field['id'])),
        }

        type_def = InstrumentVersion.get_full_type_definition(
            instrument,
            field['type'],
        )

        if 'enumerations' in type_def:
            opts['enumerations'] = [
                {
                    'id': key,
                    'text': self._text(
                        defn.get('description', key) if defn else key
                    )
                }
                for key, defn in type_def['enumerations'].items()
            ]

        return opts


try:
    from rex.forms import Form
    from rex.forms.ctl import FormOutputter
except ImportError:
    pass
else:
    class MobileFormConvertTask(Task, FormOutputter):
        """
        convert an SMS Interaction Configuration to a Web Form Configuration

        The mobile-form-convert task will take an input SMS Interaction
        Configuration file and convert it to an equivalent Web Form
        Configuration.

        The configuration is the path to the file containing the SMS
        Interaction Configuration to format.
        """

        name = 'mobile-form-convert'

        class arguments(object):  # noqa
            configuration = argument(str)

        def __call__(self):
            configuration = open_and_validate(self.configuration)

            form = Interaction.convert_configuration_to_form(configuration)
            try:
                # Double check what we produced to make sure it's valid.
                Form.validate_configuration(form)
            except ValidationError as exc:  # pragma: no cover
                raise Error(
                    'Unable to validate form configuration: %s' % exc.message
                )

            self.do_output(form)

