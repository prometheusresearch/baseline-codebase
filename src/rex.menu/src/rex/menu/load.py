#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import (
        autoreload, get_packages, Validate, AnyVal, MaybeVal, StrVal, SeqVal,
        RecordVal, UnionVal, BoolVal, ProxyVal, Error, set_location, locate,
        Location, Error, guard)
from rex.web import PathMask, PathMap, authorize, confine
from .menu import Menu
from webob.exc import HTTPUnauthorized
import collections
import re


class MenuItem(object):
    """
    An entry in the hierarchical catalog of application pages.

    `title`
        The name of the page.
    `handler`
        The page renderer.
    `items`
        A list of subordinate menu items.
    `new_window`
        Indicates whether the page should be opened in a new window.
    `route`
        Routing table of the current and all subordinate entries.
    """

    def __init__(self, title, handler=None, items=[], new_window=False):
        if isinstance(handler, list) and items == []:
            items = handler
            handler = None
        self.title = title
        self.handler = handler
        self.items = items
        self.new_window = new_window
        self.route = PathMap()
        if handler is not None:
            for mask in handler.masks():
                self.route.add(mask, handler)
        for item in items:
            self.route.update(item.route)

    def __iter__(self):
        return iter(self.items)

    def __repr__(self):
        args = [repr(self.title)]
        if self.handler:
            args.append(repr(self.handler))
        if self.items:
            args.append(repr(self.items))
        if self.new_window:
            args.append("new_window=%r" % self.new_window)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class PathVal(StrVal):

    def __call__(self, data):
        data = super(PathVal, self).__call__(data)
        try:
            PathMask.split(data)
        except ValueError as exc:
            raise Error("Got ill-formed path:", exc)
        return data


class LoadMenu(object):
    # Parses `menu.yaml` file.

    item_validate = RecordVal(
            ('title', StrVal),
            ('path', MaybeVal(PathVal), None),
            ('access', MaybeVal(StrVal), None))

    menu_validate = RecordVal(
            ('title', StrVal),
            ('access', MaybeVal(StrVal), None),
            ('items', SeqVal(item_validate), []))

    validate = RecordVal(
            ('access', MaybeVal(StrVal), None),
            ('menu', SeqVal(menu_validate), []))

    def __init__(self, open=open):
        self.open = open
        self.menu_by_record_type = {}
        # Generate `menu.yaml` validator.
        item_validate = ProxyVal()
        items_validate = SeqVal(item_validate)
        menu_pairs = []
        for menu_type in Menu.all():
            menu_validate = RecordVal(
                    (menu_type.key, menu_type.validate),
                    ('title', StrVal),
                    ('path', MaybeVal(PathVal), None),
                    ('access', MaybeVal(StrVal), None),
                    ('new_window', BoolVal, False),
                    ('items', items_validate, []))
            menu_pairs.append((menu_type.key, menu_validate))
            self.menu_by_record_type[menu_validate.record_type] = menu_type
        menu_pairs.append(RecordVal(
                ('title', StrVal),
                ('path', MaybeVal(PathVal), None),
                ('access', MaybeVal(StrVal), None),
                ('new_window', BoolVal, False),
                ('items', items_validate, [])))
        item_validate.set(UnionVal(*menu_pairs))
        self.validate = RecordVal(
                ('access', MaybeVal(StrVal), None),
                ('menu', items_validate, []))

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
            path = menu_package.abspath('menu.yaml')
            with guard("While loading application menu:", path):
                with self.open(path) as stream:
                    spec = self.validate.parse(stream, open=self.open)

        # Build the menu.
        menus = []
        seen = PathMap()
        items = []
        for item_spec in spec.menu:
            item = self.build(item_spec, '', spec.access or 'authenticated', seen)
            items.append(item)
        return MenuItem('', None, items)

    def build(self, spec, base_path, base_access, seen):
        # Creates a `MenuItem` object from the given YAML record.
        title = spec.title
        handler = None
        path = spec.path or (base_path + '/' + self._title_to_path(spec.title))
        access = spec.access or base_access
        items = []
        new_window = spec.new_window
        if type(spec) in self.menu_by_record_type:
            menu_type = self.menu_by_record_type[type(spec)]
            mask = PathMask(path)
            if mask in seen:
                error = Error("Detected duplicate or ambiguous path:", mask)
                error.wrap("Defined in:", locate(spec))
                error.wrap("And previously in:", locate(seen[mask]))
                raise error
            seen.add(mask, spec)
            value = getattr(spec, menu_type.key)
            handler = menu_type(path, access, value)
        for item_spec in spec.items:
            item = self.build(item_spec, path, access, seen)
            items.append(item)
        return MenuItem(title, handler, items, new_window=new_window)

    @staticmethod
    def _title_to_path(title):
        # Generates a URL from the title.
        return (re.sub('[^0-9a-zA-Z]+', ' ', title) \
                .strip().replace(' ', '-').lower() or '-')


@autoreload
def get_menu(open=open):
    """
    Loads the application menu.
    """
    load = LoadMenu(open=open)
    return load()


