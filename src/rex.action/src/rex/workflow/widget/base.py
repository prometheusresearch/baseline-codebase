"""

    rex.workflow.widget.base
    ========================

    Base classes for workflow and action widgets.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import cached, StrVal
from rex.widget.modern import Widget, Field, undefined
from rex.widget.urlmap import WidgetRenderer

from ..workflow import Workflow
from ..action import Action

__all__ = ('ActionWidget', 'WorkflowWidget')


class _ActionDelegate(Action):
    """ Delegates action interface to underlying widget instance."""

    widget_cls = NotImplemented

    @property
    def id(self):
        widget = self._widget()
        return widget.id

    @property
    def name(self):
        widget = self._widget()
        name = widget.name
        if name is undefined:
            name = widget.default_name
        return name

    @property
    def icon(self):
        widget = self._widget()
        return widget.icon

    def context(self):
        widget = self._widget()
        return widget.context()

    def render(self):
        widget = self._widget()
        return widget.descriptor().ui

    @cached
    def _widget(self):
        widget = self.widget_cls(**self.params)
        widget.package = self.package
        return widget


class ActionWidget(Widget):

    type = NotImplemented

    js_type = None

    id = Field(StrVal())
    name = Field(StrVal(), default=undefined)
    icon = Field(StrVal(), default='cog')

    @property
    def default_name(self):
        raise NotImplementedError('%s.default_name is not implemented' % \
                                  self.__class__.__name__)

    class __metaclass__(Widget.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Widget.__metaclass__.__new__(mcs, name, bases, members)
            if 'type' in cls.fields:
                raise Error('ActionWidget cannot have field named "type"', name)
            fields = [
                (f.name, f.validate, f.default)
                for f in
                cls.fields.values() if f.configurable
            ]
            action_members = {
                'type': cls.type,
                'fields': tuple(fields),
                'widget_cls': cls,
            }
            cls.action_cls = type('%sAction' % name, (_ActionDelegate,), action_members)
            return cls

    def context(self):
        raise NotImplementedError('%s.context() is not implemented' % \
                                  self.__class__.__name__)


class _WorkflowDelegate(Workflow):

    widget_cls = NotImplemented

    @cached
    def widget_renderer(self):
        widget = self.widget_cls(**self.params)
        widget.package = self.package
        # call widget renderer with anybody as we already authorized request up
        # the stack in WorkflowRenderer
        return WidgetRenderer(widget, access='anybody')

    def __call__(self, req):
        renderer = self.widget_renderer()
        return renderer(req)


class WorkflowWidget(Widget):

    type = NotImplemented

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
                '__module__': members['__module__'],
                'type': cls.type,
                'fields': tuple(fields),
                'widget_cls': cls,
            }
            cls.workflow_cls = type('%sWorkflow' % name, (_WorkflowDelegate,), workflow_members)
            return cls
