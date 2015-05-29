#
# Copyright (c) 2014, Prometheus Research, LLC
#


from .util import to_str, to_json


__all__ = (
    'Comparable',
    'Displayable',
    'Dictable',
)


# pylint: disable=E1101


class Comparable(object):
    """
    Provides all of the rich comparison methods that allow Interface objects
    to be compared to one another.
    """

    def __eq__(self, other):
        return isinstance(other, type(self)) \
            and self.uid == other.uid

    def __ne__(self, other):
        return not self.__eq__(other)

    def __lt__(self, other):
        return self.uid < other.uid

    def __le__(self, other):
        return self.uid <= other.uid

    def __gt__(self, other):
        return self.uid > other.uid

    def __ge__(self, other):
        return self.uid >= other.uid

    def __hash__(self):
        return hash(self.__class__) ^ hash(self.uid)


class Displayable(object):
    """
    Provides the set of special methods that allow Interface objects to be
    rendered as strings.
    """

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.uid

    def __str__(self):
        return to_str(self.__unicode__())

    def __unicode__(self):
        return self.get_display_name()

    def __repr__(self):
        return '%s(%r)' % (
            self.__class__.__name__,
            self.uid,
        )


class Dictable(object):
    """
    Provides the base methods that allow Interface objects to serialize
    themselves as dictionaries.
    """

    dict_properties = ()

    def as_dict(self, extra_properties=None):
        """
        Returns a dictionary that contains the core properties of this object.

        :param extra_properties:
            the properties, in addition to the default properties, to return
            in the dictionary
        :type extra_properties: list
        :rtype: dict
        """

        extra_properties = extra_properties or []
        target_properties = set(
            list(self.dict_properties) + list(extra_properties)
        )

        ret = {
            'uid': self.uid,
        }

        for prop in target_properties:
            value = getattr(self, prop, None)
            if isinstance(value, Dictable):
                value = value.as_dict()
            ret[prop] = value

        return ret

    def as_json(self, extra_properties=None):
        """
        Returns a JSON-encoded object built from this object's dictionary.

        :param extra_properties:
            the properties, in addition to the default properties, to return
            in the JSON object
        :type extra_properties: list
        :rtype: string
        """

        return to_json(self.as_dict(extra_properties=extra_properties))

