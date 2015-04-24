"""

    rex.workflow.widget.base
    ========================

    Base classes for workflow and action widgets.

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.widget.modern import Widget

from ..workflow import Workflow
from ..action import Action

__all__ = ('ActionWidget', 'WorkflowWidget')


class _ActionDelegate(Action):
    """ Delegates action interface to underlying widget instance."""

    widget_cls = NotImplemented

    @cached_property
    def widget(self):
        return self.widget_cls(**self.params)

    def context(self):
        return self.widget.action_context()

    def render(self):
        return self.widget.descriptor().ui


class ActionWidget(Widget):

    action_type = NotImplemented

    class __metaclass__(Widget.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Widget.__metaclass__.__new__(mcs, name, bases, members)
            if 'type' in cls.fields:
                raise Error('ActionWidget cannot have field named "type"', name)
            fields = [
                (f.name, f.validate, f.default)
                for f in
                cls.fields.values() if f.configurable and f.name != 'id'
            ]
            action_members = {
                'type': cls.action_type,
                'fields': tuple(fields),
                'widget_cls': cls,
            }
            cls.action_cls = type('%sAction' % name, (_ActionDelegate,), action_members)
            return cls

    def action_context(self):
        raise NotImplementedError('%s.action_context() is not implemented' % \
                                  self.__class__.__name__)


class _WorkflowDelegate(Workflow):

    widget_cls = NotImplemented

    @cached_property
    def widget(self):
        return self.widget_cls(**self.params)

    def __call__(self, req):
        return self.widget(req)


class WorkflowWidget(Widget):

    workflow_type = NotImplemented

    class __metaclass__(Widget.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Widget.__metaclass__.__new__(mcs, name, bases, members)
            if 'type' in cls.fields:
                raise Error('WorkflowWidget cannot have field named "type"', name)
            fields = [
                (f.name, f.validate, f.default)
                for f in
                cls.fields.values() if f.configurable and f.name != 'id'
            ]
            workflow_members = {
                'type': cls.workflow_type,
                'fields': tuple(fields),
                'widget_cls': cls,
            }
            cls.workflow_cls = type('%sWorkflow' % name, (_WorkflowDelegate,), workflow_members)
            return cls
