"""

    rex.widget.descriptors
    ======================

    This module contains serializable descriptors which define interface between
    server and client code.

    :copyright: 2014, Prometheus Research, LLC

"""

from abc import ABCMeta, abstractmethod
from collections import namedtuple

from .json_encoder import register_adapter
from .util import PropsContainer

__all__ = (
    'WidgetDescriptor', 'UIDescriptor', 'UIDescriptorChildren',
    'transform_ui', 'visit_ui',
    'StateRead', 'StateReadWrite',
    'DataRead', 'DataAppend',
    )


_WidgetDescriptor = namedtuple('WidgetDescriptor', [
    'ui',
    'state',
])

class WidgetDescriptor(_WidgetDescriptor):
    """ Descriptor for a widget.

    :attr ui: UI description
    :attr state: State graph
    """

    __slots__ = ()

@register_adapter(WidgetDescriptor)
def _encode_WidgetDescriptor(desc):
    return {
        'ui': desc.ui,
        'state': desc.state
    }


class UIDescriptorBase(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def transform(self, transformer):
        raise NotImplementedError()

    @abstractmethod
    def visit(self, visitor, parent=None):
        raise NotImplementedError()


_UIDescriptor = namedtuple('UIDescriptor', ['type', 'props', 'widget', 'defer'])

class UIDescriptor(_UIDescriptor, UIDescriptorBase):
    """ UI descriptiton.

    :attr type: CommonJS module which exports React component
    :attr props: Properties which should be passed to a React component
    """

    __slots__ = ()

    def transform(self, transformer):
        ui = transformer(self)
        props = {k: v if not isinstance(v, UIDescriptorBase)
                      else v.transform(transformer)
                 for k, v in ui.props.items()}
        return ui._replace(props=props)

    def visit(self, visitor, parent=None):
        if visitor(self, parent) is not False:
            for k, v in self.props.items():
                if not isinstance(v, UIDescriptorBase):
                    continue
                v.visit(visitor, parent=self)

    def _replace_props(self, **props):
        next_props = PropsContainer(self.props)
        next_props.update(props)
        return self._replace(props=next_props)


@register_adapter(UIDescriptor)
def _encode_UIDescriptor(desc):
    encoded = {
        '__type__': desc.type,
        'props': desc.props
    }
    if desc.defer:
        encoded['defer'] = True
    return encoded


_UIDescriptorChildren = namedtuple('UIDescriptorChildren', ['children', 'defer'])

class UIDescriptorChildren(_UIDescriptorChildren, UIDescriptorBase):
    """ List of UI descriptitons.

    :attr children: A list of UI descriptors.
    """

    __slots__ = ()

    def transform(self, transformer):
        children = [child.transform(transformer) for child in self.children]
        return self._replace(children=children)

    def visit(self, visitor, parent=None):
        for child in self.children:
            child.visit(visitor, parent=parent)


@register_adapter(UIDescriptorChildren)
def _encode_UIDescriptorChildren(desc):
    encoded = {'__children__': desc.children}
    if desc.defer:
        encoded['defer'] = True
    return encoded


def transform_ui(ui, transformer):
    """ Transform UI descriptor tree ``ui`` using ``transform`` function.

    Function ``transform`` is called on each ``UIDescriptor`` instance in the
    ``ui`` tree and should return an instance of ``UIDescriptor`` which then is
    traversed further.
    """
    return ui.transform(transformer)


def visit_ui(ui, visitor, recurse=True):
    def _visitor(node, parent):
        if not recurse and parent is not ui and parent is not None:
            return False
        visitor(node)
    ui.visit(_visitor)


class StateRead(namedtuple('StateRead', ['id'])):
    """ Represents a read from state."""

    __slots__ = ()

@register_adapter(StateRead)
def _encode_StateRead(directive):
    return {'__state_read__': directive.id}


class StateReadWrite(namedtuple('StateReadWrite', ['id'])):
    """ Represents a read/write into state."""

    __slots__ = ()

@register_adapter(StateReadWrite)
def _encode_StateReadWrite(directive):
    return {'__state_read_write__': directive.id}


class DataRead(namedtuple('DataRead', ['entity', 'id', 'data', 'wrapper'])):
    """ Represents a read into a data store to fetch an entity."""

    __slots__ = ()


@register_adapter(DataRead)
def _encode_DataRead(directive):
    ref = '/%s/%s' % (directive.entity, directive.id)
    result = {'__data__': ref}
    if directive.wrapper:
        result['wrapper'] = directive.wrapper
    return result


class CollectionRead(DataRead):

    __slots__ = ()

    @property
    def collection(self):
        return self.data[self.data['entity']]


class DataAppend(namedtuple('DataAppend', ['data'])):
    """ Represents a data append."""

    __slots__ = ()

@register_adapter(DataAppend)
def _encode_DataAppend(directive):
    return {'__append__': directive.data}
