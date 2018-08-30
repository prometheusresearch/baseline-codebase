#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import datetime

from rex.core import Extension, get_settings

from .assessment import Assessment
from .completion_processor import TaskCompletionProcessor
from .entry import Entry
from .instrument import Instrument
from .subject import Subject
from .user import User
from ..discrepancies import find_discrepancies, solve_discrepancies
from ..errors import InstrumentError
from ..mixins import *
from ..util import to_unicode, memoized_property, get_implementation, \
    forget_memoized_property


__all__ = (
    'Task',
)


class Task(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a requirement that a particular Instrument be completed for a
    Subject.
    """

    #: Work has not started on the task.
    STATUS_NOT_STARTED = 'not-started'

    #: Work has been started on the task.
    STATUS_STARTED = 'started'

    #: The Task has been satisfied.
    STATUS_COMPLETE = 'complete'

    #: The Task is no longer necessary.
    STATUS_SKIPPED = 'skipped'

    #: There was a failure when trying to execute the task.
    STATUS_FAILED = 'failed'

    #: All valid values that the status property can be assigned.
    ALL_STATUSES = (
        STATUS_NOT_STARTED,
        STATUS_STARTED,
        STATUS_COMPLETE,
        STATUS_SKIPPED,
        STATUS_FAILED,
    )

    dict_properties = (
        'subject',
        'instrument',
        'priority',
        'status',
        'num_required_entries',
        'facilitator',
        'due_date',
    )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a Task from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Task to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Task
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Task; None if the specified UID does not exist
        :rtype: Task
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Tasks that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * subject (UID or instance; exact matches)
        * channel (UID or instance; exact matches)
        * instrument (UID or instance; exact matches)
        * assessment (UID or instance; exact matches)
        * status (exact matches; can accept a list of statuses to match)
        * due_by (datetime; returns null due_dates or those earlier than param)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Tasks to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Tasks to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Tasks
        :type user: User
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
            status=None,
            num_required_entries=None,
            facilitator=None,
            due_date=None,
            implementation_context=None):
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
        :param num_required_entries:
            the number of Entries this Task requires be completed
        :type num_required_entries: int
        :param facilitator:
            the User that facilitated this Task
        :type facilitator: User
        :param due_date: the date/time this Task is expected to be completed by
        :type due_date: datetime
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the Task in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Task
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('task')

    def __init__(
            self,
            uid,
            subject,
            instrument,
            priority,
            assessment=None,
            status=None,
            num_required_entries=None,
            facilitator=None,
            due_date=None):
        self._uid = to_unicode(uid)

        if not isinstance(subject, (Subject, str)):
            raise ValueError(
                'subject must be an instance of Subject or a UID of one'
            )
        self._subject = subject

        if not isinstance(instrument, (Instrument, str)):
            raise ValueError(
                'instrument must be an instance of Instrument or a UID of one'
            )
        self._instrument = instrument

        if not isinstance(priority, int):
            raise ValueError('priority must be an integer')
        self._priority = priority

        if not isinstance(assessment, (Assessment, str)) \
                and assessment is not None:
            raise ValueError(
                'assessment must be an instance of Assessment or a UID of one'
            )
        self._assessment = assessment

        self.status = status or self.__class__.STATUS_NOT_STARTED

        self._num_required_entries = num_required_entries or None

        self.facilitator = facilitator
        self.due_date = due_date

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

        if isinstance(self._subject, str):
            subject_impl = get_implementation('subject')
            return subject_impl.get_by_uid(self._subject)
        else:
            return self._subject

    @memoized_property
    def instrument(self):
        """
        The Instrument that this Task is requiring. Read only.

        :rtype: Instrument
        """

        if isinstance(self._instrument, str):
            instrument_impl = get_implementation('instrument')
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
    def num_required_entries(self):
        """
        The number of Entries this Task requires be completed. Read only.

        :rtype: int
        """

        if not self._num_required_entries:
            return get_settings().instrument_default_required_entries
        return self._num_required_entries

    @memoized_property
    def facilitator(self):  # pylint: disable=method-hidden
        """
        The User that facilitated this Task.

        :rtype: User
        """

        if isinstance(self._facilitator, str):
            user_impl = get_implementation('user')
            return user_impl.get_by_uid(self._facilitator)
        else:
            return self._facilitator

    @facilitator.setter
    def facilitator(self, value):
        if not isinstance(value, (str, User)) and value is not None:
            raise ValueError(
                '"%s" is not a valid Facilitator' % (
                    value,
                )
            )

        # pylint: disable=attribute-defined-outside-init
        self._facilitator = value
        forget_memoized_property(self, 'facilitator')

    @property
    def due_date(self):
        """
        The date/time this Task is expected to be completed.

        :rtype: datetime
        """

        return self._due_date

    @due_date.setter
    def due_date(self, value):
        if not isinstance(value, datetime) and value is not None:
            raise ValueError(
                '"%s" is not a valid Due Date' % (
                    value,
                )
            )

        # pylint: disable=attribute-defined-outside-init
        self._due_date = value

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
        # pylint: disable=attribute-defined-outside-init
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
            self.__class__.STATUS_FAILED,
        )

    @property
    def can_enter_data(self):
        """
        Indicates whether or not this Task is in a state that allows for new
        preliminary Entries to be created. Read only.

        :rtype: bool
        """

        if not self.is_done:
            entries = self.get_entries(type=Entry.TYPE_PRELIMINARY)
            if self.num_required_entries > len(entries):
                return True
        return False

    @property
    def can_reconcile(self):
        """
        Indicates whether or not this Task is in a state that allows for
        reconciliation to occur. Read only.

        :rtype: bool
        """

        if not self.is_done:
            entries = self.get_entries(type=Entry.TYPE_PRELIMINARY)
            completed = len([
                entry
                for entry in entries
                if entry.is_done
            ])
            if completed > 0:
                if completed == len(entries):
                    if len(entries) >= self.num_required_entries:
                        return True
        return False

    @memoized_property
    def assessment(self):
        """
        The Assessment associated with the Task.

        :returns: the associated Assessment, or None if one does not exist yet
        :rtype: Assessment
        """

        if isinstance(self._assessment, str):
            assessment_impl = get_implementation('assessment')
            return assessment_impl.get_by_uid(self._assessment)
        else:
            return self._assessment

    @assessment.setter
    def assessment(self, value):
        if not isinstance(value, (str, Assessment)) \
                and value is not None:
            raise ValueError(
                '"%s" is not a valid Assessment' % (
                    value,
                )
            )

        self._assessment = value
        forget_memoized_property(self, 'assessment')

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

    def start_entry(
            self,
            user,
            entry_type=None,
            override_workflow=False,
            ordinal=None,
            entry_implementation_context=None):
        """
        Creates a new Entry for the Assessment associated with this Task.

        :param user: the user starting the Entry
        :type user: User
        :param entry_type:
            the type of Entry to create; if not specified, defaults to
            ``TYPE_PRELIMINARY``
        :type entry_type: string
        :param override_workflow:
            indicates whether or not the normal workflow rules should be
            overridden when starting a new Entry. This essentially overrides
            the check of the ``can_enter_data`` property. If not specified,
            defaults to ``False``.
        :type override_workflow: bool
        :param ordinal:
            the number to use as the ordinal position in the scope of all
            Entries for an Assessment; if not specified, one will be generated
        :type ordinal: int
        :param entry_implementation_context:
            the extra, implementation-specific variables necessary to create
            the Entry in the data store; if not specified, defaults to None
        :type entry_implementation_context: dict
        :rtype: Entry
        :raises:
            DataStoreError if there was an error writing to the datastore
        :raises:
            FormError if the current state of the Task does not allow an
            Entry to be created
        """

        entry_type = entry_type or Entry.TYPE_PRELIMINARY
        if entry_type == Entry.TYPE_PRELIMINARY \
                and not self.can_enter_data \
                and not override_workflow:
            raise InstrumentError(
                'This Task does not allow an additional Preliminary Entry.'
            )

        if not self.assessment:
            assessment_impl = Assessment.get_implementation()
            self._assessment = assessment_impl.create(
                self.subject,
                self.instrument_version,
            )
            forget_memoized_property(self, 'assessment')

        entry_impl = get_implementation('entry')
        entry = entry_impl.create(
            self.assessment,
            entry_type,
            user.login,
            ordinal=ordinal,
            implementation_context=entry_implementation_context,
        )

        return entry

    def get_entries(self, **search_criteria):
        """
        Retreives the Entries for the Asssessment assoicated with this Task.

        :rtype: list of Entries
        """

        if self.assessment:
            search_criteria['assessment'] = self.assessment.uid
            entry_impl = get_implementation('entry')
            return entry_impl.find(**search_criteria)
        return []

    def complete_entry(self, entry, user):  # pylint: disable=no-self-use
        """
        Marks the specified Entry as being complete and progresses the Task
        further along its workflow.

        :param entry: the Entry to mark complete
        :type entry: Entry
        :param user: the User who completed the Entry
        :type user: User
        """

        entry.complete(user)
        entry.save()

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
            raise InstrumentError(
                'No Entries were found to create a solution from'
            )
        elif len(entries) == 1:
            # Only one Entry, there's nothing to solve.
            return entries[0].data

        return solve_discrepancies(
            self.instrument_version,
            entries,
            reconciled_discrepancies,
        )

    def reconcile(
            self,
            user,
            reconciled_discrepancies=None,
            override_workflow=False):
        """
        Marks the Task as being complete, creates a Reconciliation Entry, and
        completes the associated Assessment with the specified data.

        :param user: the User who completed the Task
        :type user: User
        :param reconciled_discrepancies:
        :type reconciled_discrepancies: dict
        :param override_workflow:
            indicates whether or not the normal workflow rules should be
            overridden when reconciling the Task. This essentially overrides
            the check of the ``can_reconcile`` property. If not specified,
            defaults to ``False``.
        :type override_workflow: bool
        :raises:
            DataStoreError if there was an error writing to the datastore
        :raises:
            InstrumentError if the current state of the Task does not allow
            reconciliation
        """

        if not self.can_reconcile and not override_workflow:
            raise InstrumentError(
                'This Task cannot be reconciled in its current state.',
            )

        reconciled_data = self.solve_discrepancies(reconciled_discrepancies)

        entry = self.start_entry(user, Entry.TYPE_RECONCILED)
        entry.data = reconciled_data
        entry.complete(user)
        entry.save()

        self.assessment.data = reconciled_data
        self.assessment.complete(user)
        self.assessment.save()

        calculationset_impl = get_implementation('calculationset')
        calculationset = calculationset_impl.find(
            instrument_version=self.assessment.instrument_version,
            limit=1,
        )
        if calculationset:
            results = calculationset[0].execute(
                assessment=entry.assessment
            )
            self.assessment.set_meta('calculations', results)
            self.assessment.save()
            resultset_impl = get_implementation('resultset')
            resultset_impl.create(self.assessment, results)

        self.status = Task.STATUS_COMPLETE
        self.save()

        TaskCompletionProcessor.execute_processors(self, user)

    def save(self, implementation_context=None):
        """
        Persists the Task into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the Task in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
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

