"""

    rex.widget.descriptors
    ======================

    This module contains serializable descriptors which define interface between
    server and client code.

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple

from .json_encoder import register_adapter
from .util import PropsContainer

__all__ = (
    'WidgetDescriptor', 'UIDescriptor', 'UIDescriptorChildren',
    'transform_ui',
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


_UIDescriptor = namedtuple('UIDescriptor', ['type', 'props', 'widget', 'defer'])

class UIDescriptor(_UIDescriptor):
    """ UI descriptiton.

    :attr type: CommonJS module which exports React component
    :attr props: Properties which should be passed to a React component
    """

    __slots__ = ()

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

class UIDescriptorChildren(_UIDescriptorChildren):
    """ List of UI descriptitons.

    :attr children: A list of UI descriptors.
    """

    __slots__ = ()

@register_adapter(UIDescriptorChildren)
def _encode_UIDescriptorChildren(desc):
    encoded = {'__children__': desc.children}
    if desc.defer:
        encoded['defer'] = True
    return encoded


def transform_ui(ui, transform):
    """ Transform UI descriptor tree ``ui`` using ``transform`` function.

    Function ``transform`` is called on each ``UIDescriptor`` instance in the
    ``ui`` tree and should return an instance of ``UIDescriptor`` which then is
    traversed further.
    """
    if isinstance(ui, UIDescriptor):
        ui = transform(ui)
        props = {k: v if not isinstance(v, (UIDescriptorChildren, UIDescriptor))
                      else transform_ui(v, transform)
                 for k, v in ui.props.items()}
        ui = ui._replace(props=props)
        return ui
    elif isinstance(ui, UIDescriptorChildren):
        children = [transform_ui(child, transform) for child in ui.children]
        ui = ui._replace(children=children)
        return ui
    else:
        raise TypeError(
            'expected UIDescriptor or UIDescriptorChildren, got: %r', ui)


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
