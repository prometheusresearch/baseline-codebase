"""

    rex.widget.util
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""


import re
import importlib
import json
from collections import MutableMapping, OrderedDict

import yaml
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers

from rex.db import get_db
from rex.core import Error, Validate, AnyVal, StrVal, ChoiceVal

from .transitionable import Transitionable, TransitionableRecord, as_transitionable


__all__ = ('undefined', 'MaybeUndefinedVal', 'PropsContainer', 'JSValue')


class JSValue(TransitionableRecord):
    """ A reference to some JS value exported from a package."""

    __transit_tag__ = 'js-value'
    fields = ('package', 'symbol')

    def __init__(self, *args, **kwargs):
        if len(args):
            args = tuple(['@js-package::' + args[0], args[1]])
        elif 'package' in kwargs:
            kwargs['package'] = '@js-package::' + kwargs['package']
        super(JSValue, self).__init__(*args, **kwargs)


class Undefined(Transitionable):
    """ An undefined value.

    Used to represent ``undefined`` value in JavaScript.
    """

    __slots__ = ()
    __transit_tag__ = 'undefined'

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = object.__new__(cls)
        return cls._instance

    def __bool__(self):
        return False

    def __repr__(self):
        return 'undefined'

    def __transit_format__(self, req, path):
        return []

    __str__ = __repr__
    __unicode__ = __repr__


undefined = Undefined()


class MaybeUndefinedVal(Validate):

    def __init__(self, validate=AnyVal()):
        self.validate = validate

    def __call__(self, value):
        if value is undefined:
            return value
        return self.validate(value)

    def construct(self, loader, node):
        return self.validate.construct(loader, node)

    def __repr__(self):
        return '%s(%r)' % (self.__class__.__name__, self.validate)

    __str__ = __repr__
    __unicode__ = __repr__


class PropsContainer(MutableMapping):
    """ Widget description props container.

    This is thin wrapper for dict which automatically camel cases all keys to
    match JavaScript coding convention.
    """

    def __init__(self, mapping=None):
        self.__dict__['_storage'] = OrderedDict()
        if mapping:
            for k, v in list(mapping.items()):
                self[k] = v

    def __getattr__(self, name):
        return self[name]

    def __setattr__(self, name, value):
        self[name] = value

    def __delattr__(self, name):
        del self[name]

    def __getitem__(self, name):
        return self._storage[to_camelcase(name)]

    def __setitem__(self, name, value):
        self._storage[to_camelcase(name)] = value

    def __delitem__(self, name):
        del self._storage[to_camelcase(name)]

    def __contains__(self, name):
        return to_camelcase(name) in self._storage

    def __iter__(self):
        return iter(self._storage)

    def __len__(self):
        return len(self._storage)

    def __str__(self):
        storage = ', '.join('%r: %r' % (k, v)
                            for k, v in sorted(self._storage.items()))
        return '<%s {%s}>' % (self.__class__.__name__, storage)

    __unicode__ = __str__
    __repr__ = __str__


_to_camelcase_re = re.compile(r'_([a-zA-Z])')


def to_camelcase(value):
    """ Return camelCased version of ``value``."""
    return _to_camelcase_re.sub(lambda m: m.group(1).upper(), value)


@as_transitionable(PropsContainer, tag='map')
def _format_PropsContainer(value, req, path): # pylint: disable=invalid-name
    return value._storage


YAML_STR_TAG = 'tag:yaml.org,2002:str'


def pop_mapping_key(node, key):
    assert isinstance(node, yaml.MappingNode)
    value = []
    for n, (k, v) in enumerate(node.value):
        if isinstance(k, yaml.ScalarNode) and k.tag == YAML_STR_TAG and k.value == key:
            node = yaml.MappingNode(
                node.tag,
                node.value[:n] + node.value[n + 1:],
                start_mark=node.start_mark,
                end_mark=node.end_mark,
                flow_style=node.flow_style)
            return v, node
    return None, node


def add_mapping_key(node, key, value):
    assert isinstance(node, yaml.MappingNode)
    key_node = yaml.ScalarNode(YAML_STR_TAG, key,
                               start_mark=node.start_mark,
                               end_mark=node.end_mark)
    value_node = yaml.ScalarNode(YAML_STR_TAG, value,
                                 start_mark=node.start_mark,
                                 end_mark=node.end_mark)
    return yaml.MappingNode(
        node.tag,
        node.value + [(key_node, value_node)],
        start_mark=node.start_mark,
        end_mark=node.end_mark,
        flow_style=node.flow_style)


class WidgetClassReference(Validate):

    _validate = StrVal()

    def __call__(self, value):
        value = self._validate(value)
        if not '.' in value:
            raise Error(
                'Invalid widget class reference:',
                'should be in form "pkg.module.WidgetClass"')
        module, cls = value.rsplit('.', 1)
        try:
            module = importlib.import_module(module)
        except ImportError:
            raise Error(
                'Cannot import module:',
                module)
        if not hasattr(module, cls):
            raise Error(
                'Cannot get widget class in module:',
                '%s class in %s module' % (cls, module.__name__))
        cls = getattr(module, cls)
        from rex.widget.widget import Widget
        if not isinstance(cls, type) or not issubclass(cls, Widget):
            raise Error(
                'The value is not a widget class:',
                repr(cls))
        return cls


def product_to_pojo(product, db=None):
    with get_db(db):
        data = b''.join(emit('application/json', product)).decode('utf-8')
        return json.loads(data)


class IconVal(Validate):

    _validate = ChoiceVal(
        'asterisk',
        'plus',
        'euro',
        'eur',
        'minus',
        'cloud',
        'envelope',
        'pencil',
        'glass',
        'music',
        'search',
        'heart',
        'star',
        'star-empty',
        'user',
        'film',
        'th-large',
        'th',
        'th-list',
        'ok',
        'remove',
        'zoom-in',
        'zoom-out',
        'off',
        'signal',
        'cog',
        'trash',
        'home',
        'file',
        'time',
        'road',
        'download-alt',
        'download',
        'upload',
        'inbox',
        'play-circle',
        'repeat',
        'refresh',
        'list-alt',
        'lock',
        'flag',
        'headphones',
        'volume-off',
        'volume-down',
        'volume-up',
        'qrcode',
        'barcode',
        'tag',
        'tags',
        'book',
        'bookmark',
        'print',
        'camera',
        'font',
        'bold',
        'italic',
        'text-height',
        'text-width',
        'align-left',
        'align-center',
        'align-right',
        'align-justify',
        'list',
        'indent-left',
        'indent-right',
        'facetime-video',
        'picture',
        'map-marker',
        'adjust',
        'tint',
        'edit',
        'share',
        'check',
        'move',
        'step-backward',
        'fast-backward',
        'backward',
        'play',
        'pause',
        'stop',
        'forward',
        'fast-forward',
        'step-forward',
        'eject',
        'chevron-left',
        'chevron-right',
        'plus-sign',
        'minus-sign',
        'remove-sign',
        'ok-sign',
        'question-sign',
        'info-sign',
        'screenshot',
        'remove-circle',
        'ok-circle',
        'ban-circle',
        'arrow-left',
        'arrow-right',
        'arrow-up',
        'arrow-down',
        'share-alt',
        'resize-full',
        'resize-small',
        'exclamation-sign',
        'gift',
        'leaf',
        'fire',
        'eye-open',
        'eye-close',
        'warning-sign',
        'plane',
        'calendar',
        'random',
        'comment',
        'magnet',
        'chevron-up',
        'chevron-down',
        'retweet',
        'shopping-cart',
        'folder-close',
        'folder-open',
        'resize-vertical',
        'resize-horizontal',
        'hdd',
        'bullhorn',
        'bell',
        'certificate',
        'thumbs-up',
        'thumbs-down',
        'hand-right',
        'hand-left',
        'hand-up',
        'hand-down',
        'circle-arrow-right',
        'circle-arrow-left',
        'circle-arrow-up',
        'circle-arrow-down',
        'globe',
        'wrench',
        'tasks',
        'filter',
        'briefcase',
        'fullscreen',
        'dashboard',
        'paperclip',
        'heart-empty',
        'link',
        'phone',
        'pushpin',
        'usd',
        'gbp',
        'sort',
        'sort-by-alphabet',
        'sort-by-alphabet-alt',
        'sort-by-order',
        'sort-by-order-alt',
        'sort-by-attributes',
        'sort-by-attributes-alt',
        'unchecked',
        'expand',
        'collapse-down',
        'collapse-up',
        'log-in',
        'flash',
        'log-out',
        'new-window',
        'record',
        'save',
        'open',
        'saved',
        'import',
        'export',
        'send',
        'floppy-disk',
        'floppy-saved',
        'floppy-remove',
        'floppy-save',
        'floppy-open',
        'credit-card',
        'transfer',
        'cutlery',
        'header',
        'compressed',
        'earphone',
        'phone-alt',
        'sd-video',
        'hd-video',
        'subtitles',
        'copyright-mark',
        'registration-mark',
        'cloud-download',
        'cloud-upload',
        'level-up',
        'copy',
        'paste',
        'alert',
        'bed',
        'apple',
        'erase',
        'hourglass',
        'duplicate',
        'bitcoin',
        'btc',
        'scale',
        'education',
        'triangle-right',
        'triangle-left',
        'triangle-bottom',
        'triangle-top',
        'console',
        'superscript',
        'subscript',
        'menu-left',
        'menu-right',
        'menu-down',
        'menu-up')

    def __call__(self, value):
        return self._validate(value)
