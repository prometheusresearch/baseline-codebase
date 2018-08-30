"""

    rex.action.typing
    =================

    This module implements type system for Rex Action applications.

    :copyright: 2015, Prometheus Research, LLC

"""



import ast
import re

from rex.core import Error, Validate, StrVal
from rex.widget import as_transitionable

FIND_IDENTIFIER_RE = re.compile(r'[a-zA-Z0-9_\-]+')


def is_state_expression(value):
    return isinstance(value, str) and (
        ' ' in value or
        '!' in value or
        '(' in value or
        '&' in value or
        '|' in value or
        ')' in value
    )


def compile_expression(expression):
    scope = []
    def _compile_ref(m):
        name = m.group(0)
        if not name in scope:
            scope.append(name)
        return 'entity["meta:state:%s"]' % name
    res, _n = re.subn(FIND_IDENTIFIER_RE, _compile_ref, expression)
    return res, scope


class StateExpression(object):

    __slots__ = ('name', 'expression', 'scope')

    def __init__(self, name, expression, scope):
        self.name = name
        self.expression = expression
        self.scope = scope

    def __repr__(self):
        return "%s(expression='%s')" % (self.__class__.__name__, self.expression)

    __str__ = __unicode__ = __repr__


@as_transitionable(StateExpression, tag='rex:action:state_expr')
def _encode_StateExpression(value, req, path):
    return [value.expression, value.scope]


class StateExpressionVal(Validate):

    _validate_str = StrVal()

    def __call__(self, expression):
        expression = self._validate_str(expression)
        name = (expression
            .replace(' ', '_')
            .replace('-', '_')
            .replace('(', '_')
            .replace(')', '_')
            .replace('!', 'not_')
            .replace('||', '_or_')
            .replace('&&', '_and_')
        )
        expression, scope = compile_expression(expression)
        return StateExpression(name, expression, scope)
