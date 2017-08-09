#
# Copyright (c) 2017, Prometheus Research, LLC
#

import yaml
import hashlib

from slugify import slugify

from rex.core import cached, Validate, OnMatch, RecordVal, UStrVal, MaybeVal, OneOfVal
from rex.db import SyntaxVal
from rex.widget.transitionable import as_transitionable

__all__ = ('RefinedVal', 'OnFieldValue', 'ExpressionVal')


class RefinedVal(Validate):
    """ Wraps another validator and refines its result."""

    validator = NotImplemented

    def refine(self, value):
        return value

    def __call__(self, value):
        value = self.validator(value)
        value = self.refine(value)
        return value

    def construct(self, loader, node):
        value = self.validator.construct(loader, node)
        value = self.refine(value)
        return value


class OnFieldValue(OnMatch):

    def __init__(self, key, value):
        self.key = key
        self.value = value

    def __call__(self, data):
        if isinstance(data, dict):
            return data.get(self.key) == self.value
        elif isinstance(data, yaml.MappingNode):
            for key_node, value_node in data.value:
                if not (is_yaml_string_scalar(key_node) and
                        is_yaml_string_scalar(value_node)):
                    continue
                if (key_node.value == self.key and
                    value_node.value == self.value):
                    return True
            return False
        else:
            return False

    def __str__(self):
        return 'record with %s %r' % (self.key, self.value)


class Expression(object):

    def __init__(self, title, expression):
        self.title = title
        self.expression = expression

    @property
    @cached
    def key(self):
        # we salt the key with digest to lessen the chance of collision
        digest = hashlib.sha1(self.expression).hexdigest()[:8]
        slug = slugify(self.expression)
        return 'computed_%s_%s' % (slug, digest)

    def __repr__(self):
        return '%s(title=%r, expression=%r)' % (
                self.__class__.__name__,
                self.title,
                self.expression)

@as_transitionable(Expression, tag='map')
def _encode_Expression(value, _req, _path):
    return {'title': value.title, 'key': value.key}


class ExpressionVal(RefinedVal):
    """ Specify HTSQL expressions along with its title."""

    _validate_record = RecordVal(
        ('title', MaybeVal(UStrVal)),
        ('expression', UStrVal),
    )

    _validate_expression = UStrVal()

    validator = OneOfVal(_validate_expression, _validate_record)

    def refine(self, value):
        if isinstance(value, basestring):
            value = self._validate_record.record_type(
                    title=None,
                    expression=value)
        return Expression(value.title, value.expression)


def is_yaml_string_scalar(node):
    return isinstance(node, yaml.ScalarNode) and node.tag == u'tag:yaml.org,2002:str'
