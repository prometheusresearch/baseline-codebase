#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from collections import Counter
from copy import deepcopy
from datetime import datetime

import jsonschema

from rex.core import Extension, cached, get_settings
from rex.instrument import Subject, Instrument, InstrumentVersion, Assessment
from rex.instrument.mixins import Comparable, Displayable, Dictable
from rex.instrument.meta import *
from rex.instrument.util import to_unicode, memoized_property

from .discrepancies import find_discrepancies, solve_discrepancies
from .errors import ValidationError, FormError
from .schema import FORM_SCHEMA, FORM_ELEMENT_OPTIONS, FORM_ELEMENT_REQUIRED


__all__ = (
    'Channel',
    'Form',
    'Task',
    'Entry',
    'ParameterSupplier',
    'TaskCompletionProcessor',
)


class Channel(Extension, Comparable, Displayable, Dictable):
    """
    Represents an Electronic Data Capture system for which a Form can be
    defined.
    """

    dict_properties = (
        'title',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Channel from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Channel to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Channel; None if the specified UID does not exist
        :rtype: Channel
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Channels that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Channels to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Channels to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Channels
        """

        raise NotImplementedError()

    def __init__(self, uid, title):
        self._uid = to_unicode(uid)
        self._title = to_unicode(title)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Channel in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def title(self):
        """
        The human-readable title of the Channel.

        :rtype: unicode
        """

        return self._title

    def get_instruments(self, offset=0, limit=100, **search_criteria):
        """
        Returns Instruments that have at least one Form configured for this
        Channel.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instruments to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Instruments to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Instruments
        """

        raise NotImplementedError()

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.title

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.title,
        )


class Form(Extension, Comparable, Displayable, Dictable):
    """
    Represents a Form Configuration for a Channel of an InstrumentVersion.
    """

    dict_properties = (
        'channel',
        'instrument_version',
    )

    @classmethod
    def _validate_instrument_specifics(cls, configuration, instrument):
        all_fields = set([field['id'] for field in instrument['record']])
        unprompted = set(configuration.get('unprompted', {}).keys())
        on_pages = set()
        for page in configuration['pages']:
            for element in page['elements']:
                if element['type'] == 'question':
                    fid = element['options']['fieldId']
                    if fid in on_pages:
                        raise ValidationError(
                            'Field "%s" is used by multiple questions' % (
                                fid,
                            )
                        )
                    else:
                        on_pages.add(fid)
        on_pages = set(on_pages)

        missing = all_fields - (unprompted | on_pages)
        if missing:
            raise ValidationError(
                'There are fields which have not be used: %s' % (
                    ', '.join(missing),
                )
            )

        extra = (unprompted | on_pages) - all_fields
        if extra:
            raise ValidationError(
                'There are fields that are not in the Instrument: %s' % (
                    ', '.join(extra),
                )
            )

        # TODO ensure enumerationIDs are legit
        # TODO ensure records and matrices have all subfields addressed

    @classmethod
    def _validate_pages(cls, configuration):
        all_page_ids = [page['id'] for page in configuration['pages']]
        repeated_page_ids = [
            pid
            for pid, cnt in Counter(all_page_ids).items()
            if cnt > 1
        ]
        if repeated_page_ids:
            raise ValidationError(
                'Page identifiers are used multiple times: %s' % (
                    ', '.join(repeated_page_ids),
                )
            )

    @classmethod
    def _validate_localizations(cls, configuration):
        def ensure_localization(obj, key, label):
            if key not in obj:
                return

            if configuration['defaultLocalization'] not in obj[key]:
                raise ValidationError(
                    '%(label)s %(key)s missing localization for %(lang)s' % {
                        'label': label,
                        'key': key,
                        'lang': configuration['defaultLocalization'],
                    }
                )

        ensure_localization(configuration, 'title', 'Form')

        for page in configuration['pages']:
            for element in page['elements']:
                options = element.get('options', {})
                ensure_localization(options, 'text', 'Element')
                ensure_localization(options, 'help', 'Element')
                ensure_localization(options, 'error', 'Element')

                for enumeration in options.get('enumerations', []):
                    ensure_localization(enumeration, 'text', 'Enumeration')
                    ensure_localization(enumeration, 'help', 'Enumeration')

    @classmethod
    def _validate_element_options(cls, configuration):
        for page in configuration['pages']:
            for element in page['elements']:
                options = set(element.get('options', {}).keys())
                extra = options - FORM_ELEMENT_OPTIONS[element['type']]
                if extra:
                    raise ValidationError(
                        '"%(type)s" Element cannot have options:'
                        ' %(options)s' % {
                            'type': element['type'],
                            'options': ', '.join(extra),
                        }
                    )
                missing = FORM_ELEMENT_REQUIRED[element['type']] - options
                if missing:
                    raise ValidationError(
                        '"%(type)s" Element missing required options:'
                        ' %(options)s' % {
                            'type': element['type'],
                            'options': ', '.join(missing),
                        }
                    )

    @classmethod
    def validate_configuration(cls, configuration, instrument_definition=None):
        """
        Validates that the specified configuration is a legal Web Form
        Configuration.

        :param configuration: the Form configuration to validate
        :type configuration: string or dict
        :param instrument_definition:
            the Common Instrument Definition that the Form is building from
        :type instrument_definition: string or dict
        :raises:
            ValidationError if the specified configuration fails any of the
            requirements
        """

        if isinstance(configuration, basestring):
            configuration = json.loads(configuration)
        if not isinstance(configuration, dict):
            raise ValidationError(
                'Form Configurations must be mapped objects.'
            )

        # Make sure it validates against the schema.
        try:
            jsonschema.validate(configuration, FORM_SCHEMA)
        except jsonschema.ValidationError as ex:
            raise ValidationError(ex.message)

        # Make sure page IDs are unique.
        cls._validate_pages(configuration)

        # Make sure everything has the defaultLocalization.
        cls._validate_localizations(configuration)

        # Make sure elements have appropriate options.
        cls._validate_element_options(configuration)

        # If we have an Instrument definition to validate against, do so.
        if instrument_definition:
            if isinstance(instrument_definition, basestring):
                instrument_definition = json.loads(instrument_definition)
            if not isinstance(instrument_definition, dict):
                raise ValidationError(
                    'Instrument Definitions must be mapped objects.'
                )
            cls._validate_instrument_specifics(
                configuration,
                instrument_definition,
            )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Form from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Form to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Form; None if the specified UID does not exist
        :rtype: Form
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Forms that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Forms to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Forms to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Forms
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, channel, instrument_version, configuration):
        """
        Creates a Form in the datastore and returns a corresponding
        Form instance.

        Must be implemented by concrete classes.

        :param channel:
            the Channel the Form will belong to
        :type channel: Channel
        :param instrument_version:
            the InstrumentVersion the Form is an implementation of
        :type instrument_version: InstrumentVersion
        :param configuration: the JSON Web Form Configuration for the Form
        :type configuration: dict or JSON string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Form
        """

        raise NotImplementedError()

    def __init__(self, uid, channel, instrument_version, configuration):
        self._uid = to_unicode(uid)

        if not isinstance(channel, (Channel, basestring)):
            raise ValueError(
                'channel must be an instance of Channel or a UID of one'
            )
        self._channel = channel

        if not isinstance(instrument_version, (InstrumentVersion, basestring)):
            raise ValueError(
                'instrument_version must be an instance of InstrumentVersion'
                ' or a UID of one'
            )
        self._instrument_version = instrument_version

        if isinstance(configuration, basestring):
            self._configuration = json.loads(configuration)
        else:
            self._configuration = deepcopy(configuration)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Form in the datastore. Read
        only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def channel(self):
        """
        The Channel that this Form belongs to. Read only.

        :rtype: Channel
        """

        if isinstance(self._channel, basestring):
            channel_impl = get_settings().forms_implementation.channel
            return channel_impl.get_by_uid(self._channel)
        else:
            return self._channel

    @memoized_property
    def instrument_version(self):
        """
        The InstrumentVersion that this Form is an implementation of. Read
        only.

        :rtype: InstrumentVersion
        """

        if isinstance(self._instrument_version, basestring):
            iv_impl = \
                get_settings().instrument_implementation.instrumentversion
            return iv_impl.get_by_uid(self._instrument_version)
        else:
            return self._instrument_version

    @property
    def configuration(self):
        """
        The Web Form Configuration of this Form.

        :rtype: dict
        """

        return self._configuration

    @configuration.setter
    def configuration(self, value):
        self._configuration = deepcopy(value)

    @property
    def configuration_json(self):
        """
        The Web Form Configuration of this Form.

        :rtype: JSON-encoded string
        """

        return json.dumps(self._configuration, ensure_ascii=False)

    @configuration_json.setter
    def configuration_json(self, value):
        self.configuration = json.loads(value)

    def validate(self, instrument_schema=None):
        """
        Validates that this Form is a legal Web Form Configuration.

        :raises:
            ValidationError if the Form fails any of the requirements
        """

        if (not instrument_schema) and self.instrument_version:
            instrument_schema = self.instrument_version.definition

        return self.__class__.validate_configuration(
            self.configuration,
            instrument_schema,
        )

    def save(self):
        """
        Persists the Form into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    # pylint: disable=W0221
    def get_display_name(self, locale=None):
        """
        Returns a unicode string that represents this Form, suitable for use
        in human-visible places.

        :param locale:
            the locale of title to retrieve; if not specified, or if the
            specified locale is not defined in the configuration, then the
            ``defaultLocalization`` in the configuration will be used
        :type locale: string
        :rtype: unicode
        """

        if self.configuration and 'title' in self.configuration:
            locale = str(locale)
            if locale not in self.configuration['title']:
                locale = self.configuration['defaultLocalization']
            return to_unicode(self.configuration['title'][locale])
        else:
            return unicode(self.instrument_version)

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.channel,
            self.instrument_version,
        )


class Task(Extension, Comparable, Displayable, Dictable):
    """
    Represents a requirement that a particular Instrument be completed for a
    Subject.
    """

    #: Work has not started on the task.
    STATUS_NOT_STARTED = u'not-started'
    #: Work has been started on the task.
    STATUS_STARTED = u'started'
    #: Data has been collected and is awaiting reconciliation.
    STATUS_VALIDATING = u'validating'
    #: The Task has been satisfied.
    STATUS_COMPLETE = u'complete'
    #: The Task is no longer necessary.
    STATUS_SKIPPED = u'skipped'
    ALL_STATUSES = (
        STATUS_NOT_STARTED,
        STATUS_STARTED,
        STATUS_VALIDATING,
        STATUS_COMPLETE,
        STATUS_SKIPPED,
    )

    dict_properties = (
        'subject',
        'instrument',
        'priority',
        'status',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Task from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Task to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Task; None if the specified UID does not exist
        :rtype: Task
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Tasks that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Tasks to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Tasks to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Tasks
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            subject,
            instrument,
            priority=None,
            status=None):
        """
        Creates a Task in the datastore and returns the corresponding Task
        instance.

        Must be implemented by concrete classes.

        :param subject: the Subject the Task is associated with
        :type subject: Subject
        :param instrument: the Instrument the Task is for
        :type instrument: Instrument
        :param priority: the relative priority of the Task
        :type priority: int
        :param status:
            the status of the Task; if not specified, defaults to
            ``STATUS_NOT_STARTED``
        :type status: string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Task
        """

        raise NotImplementedError()

    def __init__(
            self,
            uid,
            subject,
            instrument,
            priority,
            assessment=None,
            status=None):
        self._uid = to_unicode(uid)

        if not isinstance(subject, (Subject, basestring)):
            raise ValueError(
                'subject must be an instance of Subject or a UID of one'
            )
        self._subject = subject

        if not isinstance(instrument, (Instrument, basestring)):
            raise ValueError(
                'instrument must be an instance of Instrument or a UID of one'
            )
        self._instrument = instrument

        if not isinstance(priority, int):
            raise ValueError('priority must be an integer')
        self._priority = priority

        if not isinstance(assessment, (Assessment, basestring)) \
                and assessment is not None:
            raise ValueError(
                'assessment must be an instance of Assessment or a UID of one'
            )
        self._assessment = assessment

        self.status = status or Task.STATUS_NOT_STARTED

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Task in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def subject(self):
        """
        The Subject that this Task is required of. Read only.

        :rtype: Subject
        """

        if isinstance(self._subject, basestring):
            subject_impl = get_settings().instrument_implementation.subject
            return subject_impl.get_by_uid(self._subject)
        else:
            return self._subject

    @memoized_property
    def instrument(self):
        """
        The Instrument that this Task is requiring. Read only.

        :rtype: Instrument
        """

        if isinstance(self._instrument, basestring):
            instrument_impl = \
                get_settings().instrument_implementation.instrument
            return instrument_impl.get_by_uid(self._instrument)
        else:
            return self._instrument

    @property
    def priority(self):
        """
        The priority of the Task in relation to other Tasks. Lower numbers
        indicate higher priority. Read only.

        :rtype: int
        """

        return self._priority

    @property
    def status(self):
        """
        The status of this Task.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Task status' % (
                    value,
                )
            )
        # pylint: disable=W0201
        self._status = value

    @property
    def is_done(self):
        """
        Indicates whether or not this Task is in a terminal status. Read only.

        :rtype: bool
        """

        return self.status in (
            self.__class__.STATUS_COMPLETE,
            self.__class__.STATUS_SKIPPED,
        )

    @property
    def can_reconcile(self):
        """
        Indicates whether or not this Task is in a state that allows for
        reconciliation to occur. Read only.

        :rtype: bool
        """

        # TODO: add check for number of entries
        return self.status in (
            self.__class__.STATUS_VALIDATING,
        )

    @memoized_property
    def assessment(self):
        """
        The Assessment associated with the Task. Read only.

        :returns: the associated Assessment, or None if one does not exist yet
        :rtype: Assessment
        """
        if isinstance(self._assessment, basestring):
            assessment_impl = \
                get_settings().instrument_implementation.assessment
            return assessment_impl.get_by_uid(self._assessment)
        else:
            return self._assessment

    @memoized_property
    def instrument_version(self):
        """
        The InstrumentVersion associated with this Task. Read only.

        In situations where there is an Assessment associated with this Task,
        this will be the InstrumentVersion associated with the Assessment.
        Otherwise, this will be the most recent version of the Instrument that
        this Task requires.

        :rtype: InstrumentVersion
        """

        if self.assessment:
            return self.assessment.instrument_version
        else:
            return self.instrument.latest_version

    def get_form(self, channel):
        """
        Returns the Form associated with this Task for the specified Channel.

        :param channel: the Channel to retrieve the Form for
        :type channel: Channel
        :returns:
            the Form for the specified Channel; None if one does not exist
        :rtype: Form
        """

        raise NotImplementedError()

    def start(self, user):
        """
        Marks the Task as having been started.

        :param user: the User who started the Task
        :type user: User
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def start_entry(self, user, entry_type=None):
        """
        Creates a new Entry for the Assessment associated with this Task.

        :param user: the user starting the Entry
        :type user: User
        :param entry_type:
            the type of Entry to create; if not specified, defaults to
            ``TYPE_PRELIMINARY``
        :type entry_type: string
        :rtype: Entry
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def get_entries(self, **search_criteria):
        """
        Retreives the Entries for the Asssessment assoicated with this Task.

        :rtype: list of Entries
        """

        raise NotImplementedError()

    def complete_entry(self, entry, user):
        """
        Marks the specified Entry as being complete and progresses the Task
        further along its workflow.

        :param entry: the Entry to mark complete
        :type entry: Entry
        :param user: the User who completed the Entry
        :type user: User
        """

        raise NotImplementedError()

    def get_discrepancies(self, entries=None):
        """
        Compares Entries, looking for differences in the field values.

        If discrepancies are found, this method returns a dictionary with the
        keys being field IDs, and the values being dictionaries themselves,
        with keys being Entry UIDs and the values being that Entry's value for
        the specified field.

        An example::

            {
                'simple_field_id': {
                    'entry1_uid': 'value1',
                    'entry2_uid': 'value1',
                    'entry3_uid': 'value2'
                }

                'recordList_id': {
                    '0': {
                        'field_id': {
                            'entry1_uid': 'value1',
                            'entry2_uid': 'value1',
                            'entry3_uid': 'value2'
                        }
                    }
                }

                'matrix_id': [
                    'row_id': {
                        'column_id': {
                            'entry1_uid': 'value1',
                            'entry2_uid': 'value1',
                            'entry3_uid': 'value2'
                        }
                    }
                }
            }

        For fields that are of type ``recordList``, the first level of
        sub-fields are the index within the list. For fields that are of type
        ``matrix``, the first level of sub-fields are the rows of the matrix.

        :param entries:
            the Entries that should be analyzed in the quest for discrepancies;
            if not specified, it will default to the completed preliminary
            Entries that are currently associated with this Task
        :type entries: list of Entries
        :rtype: dict
        """

        if not entries:
            entries = self.get_entries(
                type=Entry.TYPE_PRELIMINARY,
                status=Entry.STATUS_COMPLETE,
            )
        if len(entries) < 2:
            # Not enough entries to do any comparisons.
            return {}

        return find_discrepancies(
            self.instrument_version,
            entries,
        )

    def solve_discrepancies(self, reconciled_discrepancies, entries=None):
        """
        Merges the Assessment Data of the Entries together into one
        consolidated Assessment, using the provided data to resolve
        discrepancies found between the values in the various Entries.

        An example of the ``reconciled_discrepancies`` structure is::

            {
                'simple_field_id': 'value1',

                'recordlist_id': {
                    '0': {
                        'field_id': 'value2'
                    }
                }

                'matrix_id': {
                    'row_id': {
                        'column_id': 'value1'
                    }
                }
            }

        :param reconciled_discrepancies:
            the structure that is the response to the structure produced by the
            ``get_discrepancies()`` method, listing the values to use in fields
            that are disputed among the Entries
        :type reconciled_discrepancies: dict
        :param entries:
            the Entries that should be analyzed in the quest for discrepancies;
            if not specified, it will default to the completed preliminary
            Entries that are currently associated with this Task
        :type entries: list of Entries
        :rtype: dict
        """

        if not entries:
            entries = self.get_entries(
                type=Entry.TYPE_PRELIMINARY,
                status=Entry.STATUS_COMPLETE,
            )
        if len(entries) < 1:
            raise FormError('No Entries were found to create a solution from')

        return solve_discrepancies(
            self.instrument_version,
            entries,
            reconciled_discrepancies,
        )

    def reconcile(self, user, reconciled_discrepancies=None):
        """
        Marks the Task as being complete, creates a Reconciliation Entry, and
        completes the associated Assessment with the specified data.

        :param reconciled_discrepancies:
        :type reconciled_discrepancies: dict
        :param user: the User who completed the Task
        :type user: User
        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def save(self):
        """
        Persists the Task into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.subject,
            self.instrument,
        )


class Entry(Extension, Comparable, Displayable, Dictable):
    """
    Represents an initial data capture entry for an Assessment.
    """

    #: The Entry is not yet complete.
    STATUS_IN_PROGRESS = u'in-progress'
    #: The Entry is complete.
    STATUS_COMPLETE = u'complete'
    ALL_STATUSES = (
        STATUS_IN_PROGRESS,
        STATUS_COMPLETE,
    )

    #: Represents a draft Entry.
    TYPE_PRELIMINARY = u'preliminary'
    #: Represents the Reconciliation of one or more Preliminary Entries.
    TYPE_RECONCILED = u'reconciled'
    #: Represents an edit to a previously Reconciled Entry.
    TYPE_REVISION = u'revision'
    ALL_TYPES = (
        TYPE_PRELIMINARY,
        TYPE_RECONCILED,
        TYPE_REVISION,
    )

    dict_properties = (
        'status',
        'type',
        'created_by',
        'date_created',
        'modified_by',
        'date_modified',
    )

    @staticmethod
    def validate_data(data, instrument_version=None):
        """
        Validates that the specified data is a legal Assessment Document.

        :param data: the Assessment data to validate
        :type data: dict or JSON string
        :param instrument_version:
            the InstrumentVersion containing the Instrument Definition to
            validate the data against; if not specified, only the adherance to
            the base Assessment Document definition is checked
        :type instrument_version: InstrumentVersion
        :raises:
            ValidationError if the specified structure fails any of the
            requirements
        """

        return Assessment.validate_data(data, instrument_version)

    @staticmethod
    def generate_empty_data(instrument_version):
        """
        Generates an Assessment data structure that addresses the Fields and
        structure of the specified InstrumentVersion, but contains no
        responses.

        :param instrument_version: the InstrumentVersion to model the data on
        :type instrument_version: InstrumentVersion
        :returns:
        :rtype: dict
        """

        return Assessment.generate_empty_data(instrument_version)

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves an Entry from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Entry to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Entry; None if the specified UID does not exist
        :rtype: Entry
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Entries that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Entries to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Entries to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Entries
        """

        raise NotImplementedError()

    @classmethod
    def create(
            cls,
            assessment,
            entry_type,
            created_by,
            date_created=None,
            data=None,
            status=None,
            memo=None):
        """
        Creates an Entry in the datastore and returns the corresponding Entry
        instance.

        Must be implemented by concrete classes.

        :param assessment: the Assessment the Entry is associated with
        :type assessment: Assessment
        :param entry_type:
            the type of Entry to create; must be one of the types listed in
            ``ALL_TYPES``
        :type entry_type: string
        :param created_by: the user/application that is creating this Entry
        :type created_by: string
        :param date_created:
            the date this Entry was created; if not specified, defaults to
            datetime.utcnow()
        :param data:
            the Assessment data; if not specified, an empty structure will be
            generated
        :type data: dict or JSON string
        :param status:
            the status of the Entry; must be one of the statuses listed in
            ``ALL_STATUSES``; if not specified, defaults to ``in-progress``
        :type status: string
        :param memo: human-readable notes about this Entry
        :type memo: string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Entry
        """

        raise NotImplementedError()

    def __init__(
            self,
            uid,
            assessment,
            entry_type,
            data,
            created_by,
            date_created,
            modified_by=None,
            date_modified=None,
            status=None,
            memo=None):
        self._uid = to_unicode(uid)

        if not isinstance(assessment, (Assessment, basestring)):
            raise ValueError(
                'assessment must be an instance of Assessment or a UID of one'
            )
        self._assessment = assessment

        if isinstance(data, basestring):
            self._data = json.loads(data)
        else:
            self._data = deepcopy(data)

        self._type = entry_type
        self._created_by = to_unicode(created_by)
        self._date_created = date_created
        self.modified_by = modified_by or self.created_by
        self.date_modified = date_modified or self.date_created
        self.status = status or Entry.STATUS_IN_PROGRESS
        self.memo = memo

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Entry in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def assessment(self):
        """
        The Assessment this Entry is associated with. Read only.

        :rtype: Assessment
        """

        if isinstance(self._assessment, basestring):
            assessment_impl = \
                get_settings().instrument_implementation.assessment
            return assessment_impl.get_by_uid(self._assessment)
        else:
            return self._assessment

    @property
    def created_by(self):
        """
        The username or application that created this Entry. Read only.

        :rtype: unicode
        """

        return self._created_by

    @property
    def date_created(self):
        """
        The date this Entry was created. Read only.

        :rtype: datetime
        """

        return self._date_created

    @property
    def modified_by(self):
        """
        The username or application that last modified this Entry.

        :rtype: unicode
        """

        return self._modified_by

    @modified_by.setter
    def modified_by(self, value):
        # pylint: disable=W0201
        self._modified_by = to_unicode(value)

    @property
    def date_modified(self):
        """
        The date the Entry was last modified.

        :rtype: datetime
        """

        return self._date_modified

    @date_modified.setter
    def date_modified(self, value):
        if not isinstance(value, datetime):
            raise ValueError(
                '"%s" is not a valid datetime' % (
                    value,
                )
            )

        # pylint: disable=W0201
        self._date_modified = value

    @property
    def status(self):
        """
        The status of this Entry.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Entry status' % (
                    value,
                )
            )

        # pylint: disable=W0201
        self._status = value

    @property
    def is_done(self):
        """
        Indicates whether or not this Entry is in a terminal status. Read only.

        :rtype: bool
        """

        return self.status in (
            self.__class__.STATUS_COMPLETE,
        )

    @property
    def type(self):
        """
        The type that this Entry represents. Read Only

        :rtype: unicode
        """

        return self._type

    @property
    def data(self):
        """
        The Common Assessment Document that contains the data of this
        Entry.

        :rtype: dict
        """

        return self._data

    @data.setter
    def data(self, value):
        self._data = deepcopy(value)

    @property
    def data_json(self):
        """
        The Common Assessment Document that contains the data of this
        Assessment.

        :rtype: JSON-encoded string
        """

        return json.dumps(self._data, ensure_ascii=False)

    @data_json.setter
    def data_json(self, value):
        self.data = json.loads(value)

    @property
    def memo(self):
        """
        Notes about this Entry.

        :rtype: unicode or None
        """

        return self._memo

    @memo.setter
    def memo(self, value):
        # pylint: disable=W0201
        self._memo = to_unicode(value)

    def validate(self):
        """
        Validates that this Entry contains a legal Assessment Document.

        :raises:
            ValidationError if the data fails any of the requirements
        """

        return self.__class__.validate_data(
            self.data,
            self.assessment.instrument_version,
        )

    def get_meta(self, name, default=None):
        """
        A convenience method for retrieving an Assessment-level metadata
        property from the data.

        :param name: the name of the metadata property to retrieve
        :type name: string
        :param default: the value to return if the property does not exist
        :type default: string
        :returns:
            the value of the metadata property, or `default` if the property
            does not exist
        """

        return get_assessment_meta(self.data, name, default)

    def set_meta(self, name, value):
        """
        A convenience method for setting Assessment-level metadata property on
        the data.

        :param name: the name of the metadata property to set
        :type name: string
        :param value: the value of the metadata property
        :type value: string
        """

        set_assessment_meta(self.data, name, value)

    def set_application_token(self, name, version=None):
        """
        Adds (or updates) an application token to the `application` metadata
        property on the Assessment Document.

        :param name: the name of the application (typically the package name)
        :type name: string
        :param version:
            the version of the application; if not specified this method will
            attempt to find the version of the package `name`, otherwise it
            will use '?'
        :type version: string
        :returns: the full, updated application metadata property value
        """

        return set_assessment_application(
            self.data,
            name,
            version=version,
        )

    def complete(self, user):
        """
        Marks the Entry as complete and performs a validation of the
        Assessment Document.

        :param user: the User who is completing the Entry
        :type user: User
        :raises:
            ValidationError if the document failed its validation
        """

        if self.status != Entry.STATUS_COMPLETE:
            self.status = Entry.STATUS_COMPLETE
            self.set_meta('dateCompleted', datetime.utcnow().isoformat()[:19])
            self.set_application_token('rex.forms')
            self.modify(user)
            self.validate()
        else:
            raise FormError(
                'Cannot complete an Entry that is already in a terminal'
                ' state.',
            )

    def modify(self, user):
        """
        Updates the Entry's modified_by and date_modified fields.

        :param user: the User who is modifying the Entry
        :type user: User
        """

        self.modified_by = user.login
        self.date_modified = datetime.utcnow()

    def save(self):
        """
        Persists the Entry into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
        """

        raise NotImplementedError()

    def __repr__(self):
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.assessment,
            self.type,
        )


class ParameterSupplier(Extension):
    """
    Provides a customizable way to retrieve/calculate initialization parameters
    for Forms.
    """

    priority = 1000

    @classmethod
    @cached
    def all(cls):
        return sorted(
            super(ParameterSupplier, cls).all(),
            key=lambda e: e.priority,
        )

    @classmethod
    def enabled(cls):
        return cls is not ParameterSupplier

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'ParameterSupplier':
            assert cls.is_applicable != ParameterSupplier.is_applicable, \
                'abstract method %s.is_applicable()' % cls
            assert cls.get_parameters != ParameterSupplier.get_parameters, \
                'abstract method %s.get_parameters()' % cls

    @classmethod
    def get_task_parameters(cls, task):
        """
        Returns the parameters to use when initializing the Form associated
        with the specified task.

        :param task: the Task to retrieve parameters for
        :type task: Task
        :rtype: dict
        """

        parameters = {}

        for supplier in cls.all():
            supplier = supplier()
            if supplier.is_applicable(task):
                parameters.update(supplier.get_parameters(task))

        return parameters

    def is_applicable(self, task):
        """
        Indicates whether or not this ParameterSupplier is involved with the
        specified Task.

        Must be implemented by concrete classes.

        :param task: the Task to check for applicability
        :type task: Task
        :rtype: bool
        """

        raise NotImplementedError()

    def get_parameters(self, task):
        """
        Retrieves parameters that should be given to the Task's Form upon
        initialization.

        Must be implemented by concrete classes.

        :param task: the Task to retrieve parameters for
        :type task: Task
        :rtype: dict
        """

        raise NotImplementedError()


class TaskCompletionProcessor(Extension):
    """
    Provides a customizable way to implement post-Task-completion processing.
    """

    priority = 1000

    @classmethod
    @cached
    def all(cls):
        return sorted(
            super(TaskCompletionProcessor, cls).all(),
            key=lambda e: e.priority,
        )

    @classmethod
    def enabled(cls):
        return cls is not TaskCompletionProcessor

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'TaskCompletionProcessor':
            assert cls.is_applicable != TaskCompletionProcessor.is_applicable,\
                'abstract method %s.is_applicable()' % cls
            assert cls.execute != TaskCompletionProcessor.execute, \
                'abstract method %s.execute()' % cls

    @classmethod
    def execute_processors(cls, task, user):
        """
        Returns the parameters to use when initializing the Form associated
        with the specified task.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        :rtype: dict
        """

        for processor in cls.all():
            processor = processor()
            if processor.is_applicable(task, user):
                processor.execute(task, user)

    def is_applicable(self, task, user):
        """
        Indicates whether or not this TaskCompletionProcessor is involved with
        the specified Task.

        Must be implemented by concrete classes.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        :rtype: bool
        """

        raise NotImplementedError()

    def execute(self, task, user):
        """
        Performs the desired post-Task-completion logic.

        Must be implemented by concrete classes.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        """

        raise NotImplementedError()

