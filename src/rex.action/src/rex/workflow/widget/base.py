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
    def title(self):
        widget = self._widget()
        return widget.get_title()

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
    title = Field(StrVal(), default=undefined)
    icon = Field(StrVal(), default='cog')

    @property
    def default_title(self):
        raise NotImplementedError('%s.default_title is not implemented' % \
                                  self.__class__.__name__)

    def get_title(self):
        return self.title if self.title is not undefined else self.default_title


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

    def assign_props(self, props):
        pass

    @cached
    def descriptor(self):
        desc = super(ActionWidget, self).descriptor()
        inputs, outputs = self.context()
        desc.ui.props.context_spec = {'in': inputs, 'out': outputs}
        desc.ui.props.title = self.get_title()
        self.assign_props(desc.ui.props)
        return desc


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
