#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import (
        autoreload, get_packages, Validate, AnyVal, MaybeVal, StrVal, SeqVal,
        RecordVal, Error, set_location, locate, Location, Error, guard,
        UnionVal, OnScalar, OnMap)
from rex.web import PathMask, PathMap, authorize, confine
from rex.action import ActionRenderer
from rex.action.action import ActionVal
from webob.exc import HTTPUnauthorized
import collections
import re


class MenuBar(collections.namedtuple('MenuBar', ['menus'])):

    __slots__ = ()

    def __iter__(self):
        return iter(self.menus)


class Menu(collections.namedtuple('Menu', ['title', 'items'])):

    __slots__ = ()

    def __iter__(self):
        return iter(self.items)


class MenuItem(
        collections.namedtuple(
            'MenuItem',
            ['title', 'path', 'access', 'action'])):

    __slots__ = ()

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        with confine(req, self):
            path_masks = self.path_masks()
            renderer = ActionRenderer(
                    path_masks, self.action, self.access, None)
            return renderer(req)

    def path_masks(self):
        sanitized_path = self.path
        if sanitized_path.endswith('/'):
            sanitized_path = sanitized_path[:-1]
        return [
            PathMask(self.path),
            PathMask('%s/@@/{path:*}' % sanitized_path),
            PathMask('%s/@/{action:*}' % sanitized_path),
        ]


class PathVal(StrVal):

    def __call__(self, data):
        data = super(PathVal, self).__call__(data)
        try:
            PathMask.split(data)
        except ValueError, exc:
            raise Error("Got ill-formed path:", exc)
        return data


class LoadMenu(object):
    # Parses `urlmap.yaml` file.

    action_validate = UnionVal(
            (OnScalar, StrVal),
            (OnMap, ActionVal(id='')))

    item_validate = RecordVal(
            ('title', StrVal),
            ('path', MaybeVal(PathVal), None),
            ('access', MaybeVal(StrVal), None),
            ('action', action_validate))

    menu_validate = RecordVal(
            ('title', StrVal),
            ('access', MaybeVal(StrVal), None),
            ('items', SeqVal(item_validate), []))

    validate = RecordVal(
            ('access', MaybeVal(StrVal), None),
            ('menu', SeqVal(menu_validate), []))

    def __init__(self, open=open):
        self.open = open

    def __call__(self):
        # Locates and parses ``menu.yaml``.

        # Find the package with ``menu.yaml``.
        menu_packages = []
        packages = get_packages()
        for package in packages:
            if package.exists('menu.yaml'):
                menu_packages.append(package)

        # There must be no or exactly one package with ``menu.yaml``.
        if len(menu_packages) > 1:
            raise Error(
                    "Expected exactly one menu configuration,"
                    " found more than one:",
                    "\n".join([
                            "%s:/menu.yaml" % package.name
                            for package in menu_packages]))

        # Parse menu configuration.
        if not menu_packages:
            spec = self.validate({})
        else:
            [menu_package] = menu_packages
            with self.open(menu_package.abspath('menu.yaml')) as stream:
                spec = self.validate.parse(stream, open=self.open)

        # Build the menu.
        menus = []
        seen = PathMap()
        for menu_spec in spec.menu:
            menu_title = menu_spec.title
            menu_items = []
            for item_spec in menu_spec.items:
                title = item_spec.title
                path = item_spec.path or \
                        self._title_to_path(menu_spec.title, item_spec.title)
                mask = PathMask(path)
                access = item_spec.access or \
                        menu_spec.access or spec.access or 'authenticated'
                action = item_spec.action
                # Read the action definition from a file.
                if isinstance(action, str):
                    if ':' in action:
                        package_name, action_path = action.split(':', 1)
                    else:
                        package_name = menu_package.name
                        action_path = action
                    with guard("While loading menu action:", locate(item_spec)):
                        if package_name not in packages:
                            raise Error(
                                    "Detected invalid package name:",
                                    package_name)
                        action_package = packages[package_name]
                        if not action_package.exists(action_path):
                            raise Error(
                                    "Detected invalid path:", action)
                        action_path = action_package.abspath(action_path)
                        with self.open(action_path) as stream:
                            validate = ActionVal(id='')
                            action = validate.parse(stream, open=open)
                if mask in seen:
                    error = Error("Detected duplicate or ambiguous path:", mask)
                    error.wrap("Defined in:", locate(item_spec))
                    error.wrap("And previously in:", locate(seen[mask]))
                    raise error
                seen.add(mask, item_spec)
                menu_item = MenuItem(title, path, access, action)
                menu_items.append(menu_item)
            menu = Menu(menu_title, menu_items)
            menus.append(menu)
        return MenuBar(menus)

    @staticmethod
    def _title_to_path(menu_title, item_title):
        menu_segment = \
                re.sub('[^0-9a-zA-Z]+', ' ', menu_title) \
                .strip().replace(' ', '-').lower() or '-'
        item_segment = \
                re.sub('[^0-9a-zA-Z]+', ' ', item_title) \
                .strip().replace(' ', '-').lower() or '-'
        return '/%s/%s' % (menu_segment, item_segment)


@autoreload
def load_menu(open=open):
    # Parses `menu.yaml` file.
    load = LoadMenu(open=open)
    return load()


