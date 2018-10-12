#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Extension, AnyVal

from ..mixins import *
from ..util import memoized_property, get_implementation, to_unicode
from . import Assessment


__all__ = (
    'ResultSet',
)


class ResultSet(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents the results of a CalculationSet object for an Assessment.
    """

    dict_properties = (
        'assessment',
        'results',
    )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a ResultSet from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the ResultSet to retrieve
        :type uid: string
        :param user:
            the User who should have access to the desired ResultSet
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified ResultSet; None if the specified ID does not
            exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns ResultSets that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * assessment (UID or instance; exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of ResultSet to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of ResultSet to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Form
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of ResultSet
        """

        raise NotImplementedError()

    @classmethod
    def create(cls, assessment, results, implementation_context=None):
        """
        Creates a ResultSet in the datastore and returns a corresponding
        ResultSet instance.

        Must be implemented by concrete classes.

        :param assessment:
            the Assessment the ResultSet is an implementation of
        :type assessment: Assessment
        :param results: the Results of executing assessment calculations
        :type results: dict or JSON/YAML-encoded string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the ResultSet in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: ResultSet
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('resultset')

    def __init__(
            self,
            uid,
            assessment,
            results):
        self._uid = to_unicode(uid)
        if not isinstance(assessment, (Assessment, str)):
            raise ValueError(
                'assessment must be an instance of Assessment'
                ' or a UID of one'
            )
        self._assessment = assessment
        if isinstance(results, str):
            self._results = AnyVal().parse(results)
        else:
            self._results = deepcopy(results)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this ResultSet in the
        datastore. Read only.

        :rtype: unicode
        """

        return self._uid

    @memoized_property
    def assessment(self):
        """
        The Assessment that this ResultSet is in response to. Read
        only.

        :rtype: Assessment
        """

        if isinstance(self._assessment, str):
            a_impl = get_implementation('assessment')
            return a_impl.get_by_uid(self._assessment)
        else:
            return self._assessment

    @property
    def results(self):
        """
        The Common ResultSet Definition of this ResultSet.

        :rtype: dict
        """

        return self._results

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return to_unicode(self.uid)

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.assessment,
        )

