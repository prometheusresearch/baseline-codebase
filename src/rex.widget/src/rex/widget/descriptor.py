"""

    rex.widget.descriptor
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple


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


_UIDescriptor = namedtuple('UIDescriptor', ['type', 'props'])


class UIDescriptor(_UIDescriptor):
    """ UI descriptiton.

    :attr type: CommonJS module which exports React component
    :attr props: Properties which should be passed to a React component
    """

    __slots__ = ()


_UIDescriptorChildren = namedtuple('UIDescriptorChildren', ['children'])


class UIDescriptorChildren(_UIDescriptorChildren):
    """ List of UI descriptitons.

    :attr children: A list of UI descriptors.
    """

    __slots__ = ()


StateRead = namedtuple('StateRead', ['id'])
StateReadWrite = namedtuple('StateReadWrite', ['id'])
DataRead = namedtuple('DataRead', ['id'])
