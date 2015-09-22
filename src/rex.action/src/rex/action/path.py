"""

    rex.action.path
    ===============

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from rex.core import Location, set_location, locate, Validate, Error, guard
from rex.core import ProxyVal, RecordVal, UnionVal, MapVal, StrVal, SeqVal, OnField
from rex.widget import TransitionableRecord
from . import typing

class Start(TransitionableRecord):

    fields = ('then',)

    __transit_tag__ = 'rex:action:start'


class Execute(TransitionableRecord):

    fields = ('action', 'then')

    __transit_tag__ = 'rex:action:execute'


class Repeat(TransitionableRecord):

    fields = ('repeat', 'then')

    __transit_tag__ = 'rex:action:repeat'


class InstructionValBase(Validate):

    instruction_type = NotImplemented
    instruction_validator = NotImplemented
    instruction_match = NotImplemented

    def __call__(self, value):
        if isinstance(value, self.instruction_type):
            return value
        value = self.instruction_validator(value)
        return self.instruction_type(**value._asdict())

    def construct(self, loader, node):
        value = self.instruction_validator.construct(loader, node)
        value = self.instruction_type(**value._asdict())
        set_location(value, Location.from_node(node))
        return value

    @property
    def variant(self):
        return self.instruction_match, self


instruction_val = ProxyVal()


class ThenVal(Validate):

    _validate = SeqVal(instruction_val)

    def __call__(self, value):
        if value is None:
            return []
        value = self._validate(value)
        return self._check(value)

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        return self._check(value)

    def _check(self, value):
        seen = set()
        for instruction in value:
            if isinstance(instruction, Execute):
                if instruction.action in seen:
                    raise Error('Found duplicate action:', instruction.action)
                seen.add(instruction.action)
            elif isinstance(instruction, Repeat):
                if instruction.repeat.action in seen:
                    raise Error('Found duplicate action:', instruction.repeat.action)
                seen.add(instruction.repeat.action)
        return value


class ExecuteActionVal(InstructionValBase):

    instruction_type = Execute
    instruction_validator = RecordVal(
        ('action', StrVal()),
        ('then', ThenVal(), [])
    )
    instruction_match = OnField('action')


class RepeatPathVal(InstructionValBase):

    instruction_type = Repeat
    instruction_validator = RecordVal(
        ('repeat', instruction_val),
        ('then', ThenVal(), [])
    )
    instruction_match = OnField('repeat')


class ExecuteActionShortcutVal(Validate):

    _validate = MapVal(StrVal(), ThenVal())

    def __call__(self, value):
        if isinstance(value, Execute):
            return value
        value = self._validate(value)
        return self._check(value)

    def _check(self, value):
        if len(value) != 1:
            raise Error('only mappings of a single key are allowed')
        action, then = value.iteritems().next()
        value = Execute(action=action, then=then)
        return value

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        value = self._check(value)
        set_location(value, Location.from_node(node))
        return value


instruction_val.set(
    UnionVal(
        ExecuteActionVal().variant,
        RepeatPathVal().variant, 
        ExecuteActionShortcutVal()))


class PathVal(Validate):

    _validate = ThenVal()

    def __init__(self, actions, context_type=None):
        self.actions = actions
        self.context_type = context_type or typing.RecordType.empty()

    def __call__(self, value):
        if isinstance(value, Start):
            return value
        instructions = self._validate(value)
        for instruction in instructions:
            self.typecheck(instruction, self.context_type, [])
        return Start(then=instructions)

    def construct(self, loader, node):
        instructions = self._validate.construct(loader, node)
        for instruction in instructions:
            self.typecheck(instruction, self.context_type, [])
        return Start(then=instructions)

    def typecheck(self, instruction, context_type, path):
        if isinstance(instruction, Execute):
            with guard('While parsing:', locate(instruction)):
                if not instruction.action in self.actions:
                    raise Error('Unknown action found:', instruction.action)
                input, output = self.actions[instruction.action].context_types
                typing.assert_is_type(input)
                typing.assert_is_type(output)
                try:
                    typing.unify(input, context_type)
                except typing.KindsDoNotMatch as err:
                    error = Error('Unification error:', 'type kinds do not match')
                    error.wrap('One type is %s:' % type_name(err.kind_a), err.type_a)
                    error.wrap('Another type is %s:' % type_name(err.kind_b), err.type_b)
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.InvalidRowTypeUsage:
                    error = Error('Row types are only valid within a record types')
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.UnknownKind as err:
                    error = Error('Unification error:', 'unknown kinds')
                    error.wrap('One type of kind %s' % err.kind_a, err.type_a)
                    error.wrap('Another type of kind %s' % err.kind_b, err.type_b)
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.RecordTypeMissingKey as err:
                    error = Error(
                        'Action "%s" cannot be used here:' % instruction.action,
                        'Context is missing "%s"' % err.type)
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.RowTypeMismatch as err:
                    error = Error(
                        'Action "%s" cannot be used here:' % instruction.action,
                        'Context has "%s" but expected to have "%s"' % (
                            err.type_b, err.type_a))
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.UnificationError as err:
                    error = Error('Type unification error:', err)
                    error = format_unification_error(error, context_type, path, instruction.action)
                    raise error

            next_context_type = update_context_type(context_type, output)
            if instruction.then:
                return [
                    pair
                    for next_instruction in instruction.then
                    for pair in self.typecheck(next_instruction, next_context_type, path + [instruction.action])
                ]
            else:
                return [(instruction, next_context_type)]

        elif isinstance(instruction, Repeat):
            end_types = self.typecheck(instruction.repeat, context_type, path + ['<repeat loop>'])

            repeat_invariant, _ = self.actions[instruction.repeat.action].context_types
            for end_instruction, end_type in end_types:
                with guard('While parsing:', locate(end_instruction)):
                    try:
                        typing.unify(repeat_invariant, end_type)
                    except typing.RecordTypeMissingKey as err:
                        error = Error(
                            'Repeat ends with a type which is incompatible with its beginning:',
                            'Missing "%s"' % err.type)
                        raise error
                    except typing.RowTypeMismatch as err:
                        error = Error(
                            'Repeat ends with a type which is incompatible with its beginning:',
                            'Has "%s" but expected to have "%s"' % (
                                err.type_b, err.type_a))
                        raise error
                    except typing.UnificationError as err:
                        error = Error('Type unification error:', err)
                        error = format_unification_error(error, context_type, path, instruction.action)
                        raise error

            if instruction.then:
                return [
                    self.typecheck(next_instruction, repeat_invariant, path + ['<repeat then>'])
                    for next_instruction in instruction.then
                ]
            else:
                return instruction, repeat_invariant


def format_unification_error(error, context_type, path, action):
    error.wrap('Context:', format_context_type(context_type))
    error.wrap('While type checking action at path:', ' -> '.join(path + [action]))
    return error


def update_context_type(context_type, context_type_update):
    next_context_type = typing.RecordType.empty()
    next_context_type.rows.update(context_type.rows)
    next_context_type.rows.update(context_type_update.rows)
    return next_context_type


def format_context_type(context_type):
    if not context_type.rows:
        return '<empty context>'
    return ''.join('%s: %s' % (k, v.type.key) for k, v in sorted(context_type.rows.items()))


def type_name(kind):
    return kind.type_name if hasattr(kind, 'type_name') and kind.type_name is not NotImplemented else repr(kind)
