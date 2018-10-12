"""

    rex.action.instruction
    ======================

    This module contains instructions for wizard to interpret.

    YAML configuration is compiled to instruction tree which is then type
    checked and interpreted.

    :copyright: 2015, Prometheus Research, LLC

"""



import yaml
import cgi

from collections import namedtuple
from cached_property import cached_property

from rex.core import Location, locate, set_location, Validate, Error, AnyVal
from rex.core import RecordVal, UnionVal, MapVal, StrVal, SeqVal, OnField
from rex.widget import TransitionableRecord

__all__ = ('Start', 'Execute', 'IncludeWizard', 'Repeat', 'Replace',
           'InstructionVal', 'PathVal', 'visit', 'map', )


class Instruction(TransitionableRecord):
    """ Base class for instructions."""

    def __clone__(self, **values):
        inst = super(Instruction, self).__clone__(**values)
        location = locate(self)
        if location:
            set_location(inst, location)
        return inst

    def __transit_format__(self, req, path):
        return [
            getattr(self, field) for field in self._fields
            if field != 'action_instance'
        ]  # pylint: disable=no-member


class Start(Instruction):
    """ Start of the wizard execution."""

    fields = ('then', )

    __transit_tag__ = 'rex:action:start'


class Execute(Instruction):
    """ Execute action."""

    fields = ('id', 'action', 'then', 'action_instance')

    __transit_tag__ = 'rex:action:execute'


class IncludeWizard(Execute):
    """ Execute action."""

    __transit_tag__ = 'rex:action:include_wizard'


class Replace(Instruction):
    """ Replace current position with a new one."""

    fields = ('replace', 'instruction', 'traverse_back', 'traverse')

    __transit_tag__ = 'rex:action:replace'

    then = []


class Repeat(Instruction):
    """ Repeat execution path."""

    fields = ('repeat', 'then')

    __transit_tag__ = 'rex:action:repeat'

    @property
    def action_instance(self):
        return self.repeat.action_instance


def visit(instruction, visitor, state=None):
    state = visitor(instruction, state)
    if isinstance(instruction, Repeat):
        for next_instruction in instruction.repeat:
            state = visit(next_instruction, visitor, state=state)
    for next_instruction in instruction.then:
        state = visit(next_instruction, visitor, state=state)
    return state


def map(instruction, mapper):
    return _map(instruction, mapper, [])


def _map(instruction, mapper, ancestors):
    instruction = mapper(instruction, ancestors)
    if isinstance(instruction, Repeat):
        instruction = instruction.__clone__(
            repeat=[
                _map(inst, mapper, ancestors) for inst in instruction.repeat
            ], )
    if isinstance(instruction, (Start, IncludeWizard, Execute, Repeat)):
        ancestors = ancestors + [instruction]
        instruction = instruction.__clone__(
            then=[_map(inst, mapper, ancestors) for inst in instruction.then])
    return instruction


def override(instruction, actions):
    def _override(instruction, _ancestors):
        if isinstance(instruction, Execute) and instruction.action in actions:
            action_instance = actions[instruction.action]
            instruction = instruction.__clone__(
                action_instance=action_instance)
        return instruction

    return map(instruction, _override)


class ValidateWithAction(Validate):
    def __init__(self, id, resolve_action):
        self.id = id
        self.resolve_action = resolve_action


def flatten(items):
    res = []
    for item in items:
        if isinstance(item, list):
            res = res + item
        else:
            res.append(item)
    return res


class NestedSeqVal(Validate):
    """ Validate nested sequences."""

    def __init__(self, validate_item=AnyVal()):
        self.validate_item = validate_item
        self.validate_seq = SeqVal(self)

    def __call__(self, value):
        if isinstance(value, list):
            seq = self.validate_seq(value)
            return flatten(seq)
        else:
            return self.validate_item(value)

    def construct(self, loader, node):
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == 'tag:yaml.org,2002:null' and
                node.value == ''):
            return []
        if isinstance(node, yaml.SequenceNode):
            seq = self.validate_seq.construct(loader, node)
            return flatten(seq)
        else:
            return self.validate_item.construct(loader, node)


class ThenVal(ValidateWithAction):
    """ Validator for "then" part of action."""

    def __call__(self, value):
        if value is None:
            return []
        value = self._validate(value)
        value = self._check(value)
        return value

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        return self._check(value)

    @cached_property
    def _validate(self):
        return NestedSeqVal(
            UnionVal(
                ExecuteVal(self.id, self.resolve_action).variant,
                RepeatVal(self.id, self.resolve_action).variant,
                ReplaceVal(self.id, self.resolve_action).variant,
                ExecuteShortcutVal(self.id, self.resolve_action)))

    def _check(self, value):
        seen = set()
        for instruction in value:
            if isinstance(instruction, Execute):
                if instruction.action in seen:
                    raise Error('Found duplicate action:', instruction.action)
                seen.add(instruction.action)
            elif isinstance(instruction, Repeat):
                for instruction in instruction.repeat:
                    if instruction.action in seen:
                        raise Error('Found duplicate action:',
                                    instruction.action)
                    seen.add(instruction.action)
        return value


class BaseInstructionVal(ValidateWithAction):

    instruction_type = NotImplemented
    instruction_match = NotImplemented
    instruction_validator = NotImplemented

    def create_instruction(self, **values):
        return self.instruction_type(**values)

    def __call__(self, value):
        if isinstance(value, self.instruction_type):
            return value
        value = self.instruction_validator(value)
        return self.create_instruction(**value._asdict())

    def construct(self, loader, node):
        value = self.instruction_validator.construct(loader, node)
        value = self.create_instruction(**value._asdict())
        set_location(value, Location.from_node(node))
        return value

    @property
    def variant(self):
        return self.instruction_match, self


class ExecuteVal(BaseInstructionVal):
    """ Validator for :class:`Execute` instruction."""

    instruction_type = (Execute, IncludeWizard)
    instruction_match = OnField('action')

    def create_instruction(self, action=None, then=None):
        from .wizard import WizardBase as Wizard
        action_instance = self.resolve_action(action)
        if isinstance(action_instance, Wizard):
            return IncludeWizard(
                id=action,
                action=action,
                then=then,
                action_instance=action_instance)
        else:
            return Execute(
                id=action,
                action=action,
                then=then,
                action_instance=action_instance)

    @cached_property
    def instruction_validator(self):
        return RecordVal(('action', StrVal()), ('then', ThenVal(
            self.id, self.resolve_action), []))


class InstructionPointerVal(Validate):

    _validate = StrVal()

    RELATIVE_NAV_TOKENS = frozenset(['.', '..'])

    def __call__(self, value):
        value = self._validate(value)
        relative = True
        for segment in value.split('/'):
            if not segment:
                continue
            if relative and not segment in self.RELATIVE_NAV_TOKENS:
                relative = False
                continue
            if not relative and segment in self.RELATIVE_NAV_TOKENS:
                raise Error(
                    'Invalid replace pointer:',
                    '"." or ".." can be present at leading positions only')
        return value


class ReplaceVal(BaseInstructionVal):
    """ Validator for :class:`Replace` instruction."""

    instruction_type = Replace
    instruction_match = OnField('replace')

    def create_instruction(self, replace=None):
        return Replace(
            replace=replace,
            instruction=None,
            traverse_back=None,
            traverse=None)

    @cached_property
    def instruction_validator(self):
        return RecordVal(
            ('replace', InstructionPointerVal()), )


class RepeatSectionVal(ValidateWithAction):
    @cached_property
    def validator(self):
        return ThenVal(self.id, self.resolve_action)

    def __call__(self, value):
        value = self.validator(value)
        if not value:
            raise Error('Nothing to repeat:', 'Provide at least one action')
        return value

    def construct(self, loader, node):
        value = self.validator.construct(loader, node)
        if not value:
            raise Error('Nothing to repeat:', 'Provide at least one action')
        return value


class RepeatVal(BaseInstructionVal):
    """ Validator for :class:`Repeat` instruction."""

    instruction_type = Repeat
    instruction_match = OnField('repeat')

    @cached_property
    def instruction_validator(self):
        return RecordVal(('repeat', RepeatSectionVal(self.id,
                                                     self.resolve_action)),
                         ('then', ThenVal(self.id, self.resolve_action), []))


class ExecuteShortcutVal(ValidateWithAction):
    """ Validator for :class:`Execute` action shortcut."""

    def _check(self, value):
        from .wizard import WizardBase as Wizard
        if len(value) != 1:
            return Execute(id='x', action='y', then=[], action_instance=None)
            raise Error('only mappings of a single key are allowed')
        action, then = next(iter(value.items()))
        action_instance = self.resolve_action(action)
        if isinstance(action_instance, Wizard):
            return IncludeWizard(
                id=action,
                action=action,
                then=then,
                action_instance=action_instance)
        else:
            return Execute(
                id=action,
                action=action,
                then=then,
                action_instance=action_instance)

    @cached_property
    def _validate(self):
        return MapVal(StrVal(), ThenVal(self.id, self.resolve_action))

    def __call__(self, value):
        if isinstance(value, Execute):
            return value
        value = self._validate(value)
        return self._check(value)

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        value = self._check(value)
        set_location(value, Location.from_node(node))
        return value


class InstructionVal(ValidateWithAction):
    def __call__(self, value):
        validate = UnionVal(
            ExecuteVal(self.id, self.resolve_action).variant,
            RepeatVal(self.id, self.resolve_action).variant,
            ReplaceVal(self.id, self.resolve_action).variant,
            ExecuteShortcutVal(self.id, self.resolve_action))
        return validate(value)


class PathVal(Validate):
    def __init__(self, id, resolve_action):
        self.id = id
        self.resolve_action = resolve_action

    def _resolve_replace_reference(self, instruction, path):
        if isinstance(instruction, Replace):
            (delegate_instruction, traverse_back,
             traverse) = resolve_replace_reference(instruction.replace, path)
            if not isinstance(delegate_instruction, Execute):
                raise Error('Replace %s should point to another action, got:' %
                            instruction.replace,
                            delegate_instruction.__class__.__name__)
            return instruction.__clone__(
                instruction=delegate_instruction,
                traverse_back=traverse_back,
                traverse=traverse, )
        else:
            return instruction

    def __call__(self, value):
        if isinstance(value, Start):
            return value
        validate = ThenVal(self.id, self.resolve_action)
        path = validate(value)
        path = Start(then=path)
        path = map(path, self._resolve_replace_reference)
        return path

    def construct(self, loader, node):
        validate = ThenVal(self.id, self.resolve_action)
        path = validate.construct(loader, node)
        path = Start(then=path)
        path = map(path, self._resolve_replace_reference)
        return path


def resolve_replace_reference(reference, path):
    if not isinstance(reference, list):
        reference = reference.split('/')
    stack = path[:]
    traverse_back = 0
    traverse = []
    for segment in reference:
        if not segment:
            continue
        elif segment == '.':
            continue
        elif segment == '..':
            traverse_back = traverse_back + 1
            stack.pop()
        else:
            action_name, context_update = parse_reference_segment(segment)
            traverse.append((action_name, context_update))
            top = stack[-1]
            for action in top.then:
                if not isinstance(action, Execute):
                    continue
                if action.action == action_name:
                    stack.append(action)
                    break
            if top == stack[-1]:
                raise Error('Invalid reference:', '/'.join(reference))
        if not stack:
            raise Error('Invalid reference:', '/'.join(reference))
    action = stack[-1]
    return (action, traverse_back, traverse)


ReferenceSegment = namedtuple('ReferenceSegment', ['name', 'update'])


def parse_reference_segment(segment):
    if '?' in segment:
        name, update = segment.split('?', 1)
        update = cgi.parse_qs(update)
        for k, v in list(update.items()):
            if len(v) > 1:
                raise Error('Multiple context updates for the same key:',
                            segment)
            update[k] = v[0]
        return ReferenceSegment(name=name, update=update)
    else:
        return ReferenceSegment(name=segment, update=None)
