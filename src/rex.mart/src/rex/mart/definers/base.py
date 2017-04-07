#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import Extension

from ..util import record_to_dict
from ..validators import AssessmentDefinitionVal


__all__ = (
    'Definer',
)


class Definer(Extension):
    """
    An extension that allows developers to write code that in turn allows
    configuration authors to inject configurations segments into their
    definition that are determined at Mart creation time.
    """

    # The identifier of this Definer that configurations will use to invoke it.
    name = None

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def get_assessments(cls, definer, definition, **options):
        """
        Retrieves Assessment definitions for the specified Mart Definition
        using the specified Definer. All definitions are validated and
        normalized.

        :param definer: the Definer to user
        :type definer: str
        :param definition:
            the Mart Definition to retrieve Assessment definitions for
        :type str: dict
        :rtype: list of dicts
        """

        assessments = cls.mapped()[definer]().assessments(
            definition,
            **options
        )

        validate = AssessmentDefinitionVal()
        return [
            record_to_dict(validate(assessment))
            for assessment in assessments
        ]

    def assessments(self, definition, **options):
        """
        Retrieves the Assessment definitions to use with the specified Mart
        Definition.

        This can/should be implemented by extensions.

        :param definition:
            the Mart Definition to retrieve Assessment definitions for
        :type str: dict
        :rtype: list of dicts
        """

        # pylint: disable=unused-argument,no-self-use

        return []  # pragma: no cover

