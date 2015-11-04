"""

    rex.action.instruction
    ======================

    This module contains instructions for wizard to interpret.

    YAML configuration is compiled to instruction tree which is then type
    checked and interpreted.

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import Location, set_location, Validate, Error
from rex.core import RecordVal, UnionVal, MapVal, StrVal, SeqVal, OnField
from rex.widget import TransitionableRecord

__all__ = (
    'Start', 'Execute', 'ExecuteWizard', 'Repeat',
    'InstructionVal', 'PathVal',
    'visit', 'map',
)


class Start(TransitionableRecord):
    """ Start of the wizard execution."""

    fields = ('then',)

    __transit_tag__ = 'rex:action:start'


class Execute(TransitionableRecord):
    """ Execute action."""

    fields = ('action', 'then', 'action_instance')

    __transit_tag__ = 'rex:action:execute'


class ExecuteWizard(Execute):
    """ Execute action."""

    __transit_tag__ = 'rex:action:execute_wizard'


class Repeat(TransitionableRecord):
    """ Repeat execution path."""

    fields = ('repeat', 'then')

    __transit_tag__ = 'rex:action:repeat'

    @property
    def action_instance(self):
        return self.repeat.action_instance


def visit(instruction, visitor):
    visitor(instruction)
    if isinstance(instruction, Repeat):
        visit(instruction.repeat, visitor)
    for next_instruction in instruction.then:
        visit(next_instruction, visitor)


def map(instruction, mapper):
    instruction = mapper(instruction)
    instruction = instruction.__clone__(
        then=[map(inst, mapper) for inst in instruction.then])
    if isinstance(instruction, Repeat):
        instruction = instruction.__clone__(
            repeat=map(instruction.repeat, mapper))
    return instruction


class ValidateWithAction(Validate):

    def __init__(self, resolve_action):
        self.resolve_action = resolve_action



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
        return SeqVal(UnionVal(
            ExecuteVal(self.resolve_action).variant,
            RepeatVal(self.resolve_action).variant, 
            ExecuteShortcutVal(self.resolve_action)))

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
    """ Validator for :class:`Execute` action."""

    instruction_type = (Execute, ExecuteWizard)
    instruction_match = OnField('action')

    def create_instruction(self, action=None, then=None):
        from .wizard import WizardBase as Wizard
        action_instance = self.resolve_action(action)
        if isinstance(action_instance, Wizard):
            return ExecuteWizard(
                action=action,
                then=then,
                action_instance=action_instance)
        else:
            return Execute(
                action=action,
                then=then,
                action_instance=action_instance)

    @cached_property
    def instruction_validator(self):
        return RecordVal(
            ('action', StrVal()),
            ('then', ThenVal(self.resolve_action), [])
        )


class RepeatVal(BaseInstructionVal):
    """ Validator for :class:`Repeat` action."""

    instruction_type = Repeat
    instruction_match = OnField('repeat')

    @cached_property
    def instruction_validator(self):
        instruction_val = UnionVal(
            ExecuteVal(self.resolve_action).variant,
            RepeatVal(self.resolve_action).variant, 
            ExecuteShortcutVal(self.resolve_action))
        return RecordVal(
            ('repeat', instruction_val),
            ('then', ThenVal(self.resolve_action), [])
        )


class ExecuteShortcutVal(ValidateWithAction):
    """ Validator for :class:`Execute` action shortcut."""

    def _check(self, value):
        from .wizard import WizardBase as Wizard
        if len(value) != 1:
            raise Error('only mappings of a single key are allowed')
        action, then = value.iteritems().next()
        action_instance = self.resolve_action(action)
        if isinstance(action_instance, Wizard):
            return ExecuteWizard(
                action=action,
                then=then,
                action_instance=action_instance)
        else:
            return Execute(
                action=action,
                then=then,
                action_instance=action_instance)

    @cached_property
    def _validate(self):
        return MapVal(StrVal(), ThenVal(self.resolve_action))

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

    def __init__(self, resolve_action):
        self.resolve_action = resolve_action

    def __call__(self, value):
        validate = UnionVal(
            ExecuteVal(self.resolve_action).variant,
            RepeatVal(self.resolve_action).variant, 
            ExecuteShortcutVal(self.resolve_action))
        return validate(value)


class PathVal(Validate):

    def __init__(self, resolve_action):
        self.resolve_action = resolve_action

    def __call__(self, value):
        if isinstance(value, Start):
            return value
        validate = ThenVal(self.resolve_action)
        instructions = validate(value)
        return Start(then=instructions)

    def construct(self, loader, node):
        validate = ThenVal(self.resolve_action)
        instructions = validate.construct(loader, node)
        return Start(then=instructions)
