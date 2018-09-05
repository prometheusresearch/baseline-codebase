#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (
        get_packages, get_settings, Validate, ValidatingLoader, StrVal, MapVal,
        AnyVal, OneOrSeqVal, RecordVal, UnionVal, OnMatch, Record,
        set_location, locate, Location, Error, guard)
from rex.web import PathMask, PathMap
from .map import Map, Override
import os
import yaml


def _merge(*contexts):
    # Merge context dictionaries.
    merged = {}
    for context in contexts:
        for key in context:
            value = context[key]
            if (isinstance(value, dict) and
                    isinstance(merged.get(key), dict)):
                value = _merge(merged[key], value)
            merged[key] = value
    return merged


class Deferred:
    """ Object which defers either validation or construction."""

    def resolve(self, validate=None):
        """ Resolve deferred value.

        If ``validate`` is passed then it is used instead of validator supplied
        at construction time.
        """
        raise NotImplementedError(
                '%s.resolve(validate=None) is not implemented' % \
                self.__class__.__name__)


class DeferredConstruction(Deferred):
    """ Deferred construction."""

    __slots__ = ('loader', 'node', 'validate')

    def __init__(self, loader, node, validate):
        self.loader = loader
        self.node = node
        self.validate = validate

    def resolve(self, validate=None):
        validate = validate or self.validate or AnyVal()
        return validate.construct(self.loader, self.node)


class DeferredVal(Validate):
    """ Validator which produces deferred values."""

    def __init__(self, validate=None):
        self.validate = validate

    def construct(self, loader, node):
        value = DeferredConstruction(loader, node, self.validate)
        set_location(value, Location.from_node(node))
        return value


class TaggedStrVal(StrVal):

    def __init__(self, tag, pattern=None):
        super(TaggedStrVal, self).__init__(pattern)
        self.tag = tag
        self.record_type = Record.make(tag.replace('!', '').capitalize(), ['data'])

    def construct(self, loader, node):
        location = Location.from_node(node)
        with guard("While parsing:", location):
            if node.tag == self.tag and isinstance(node, yaml.ScalarNode):
                data = loader.construct_scalar(node)
                data = self.record_type(self(data))
                set_location(data, location)
                return data
            error = Error("Expected a tagged %s string" % self.tag)
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            raise error


class TaggedCollectionVal(Validate):

    def __init__(self, tag, value):
        self.tag = tag
        self.value = value

    def construct(self, loader, node):
        if node.tag == self.tag:
            if isinstance(node, yaml.ScalarNode) and node.value == '':
                node = yaml.ScalarNode('tag:yaml.org,2002:null', node.value,
                        node.start_mark, node.end_mark, node.style)
            elif isinstance(node, yaml.MappingNode):
                node = yaml.MappingNode('tag:yaml.org,2002:map', node.value,
                        node.start_mark, node.end_mark, node.flow_style)
            elif isinstance(node, yaml.SequenceNode):
                node = yaml.SequenceNode('tag:yaml.org,2002:seq', node.value,
                        node.start_mark, node.end_mark, node.flow_style)
            return self.value.construct(loader, node)
        return super(TaggedCollectionVal, self).construct(loader, node)


class OnTag(OnMatch):

    def __init__(self, tag):
        self.tag = tag

    def __call__(self, data):
        return (isinstance(data, yaml.Node) and data.tag == self.tag)

    def __str__(self):
        return "%s record" % self.tag

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.tag)


class MapLoader(ValidatingLoader):
    # Add support for `!setting` tag.

    def construct_object(self, node, deep=False):
        if node.tag != '!setting':
            return super(MapLoader, self).construct_object(node, deep)
        if not isinstance(node, yaml.ScalarNode):
            raise yaml.constructor.ConstructorError(None, None,
                    "expected a setting name, but found %s" % node.id,
                    node.start_mark)
        settings = get_settings()
        with guard("While parsing:", Location.from_node(node)):
            if not hasattr(settings, node.value):
                raise Error("Got unknown setting:", node.value)
            value = getattr(settings, node.value)
            if self.validate is not None:
                value = self.validate(value)
        return value


class LoadMap:
    # Parses `urlmap.yaml` file.

    def __init__(self, package, open=open):
        super(LoadMap, self).__init__()
        self.package = package
        self.open = open
        # Prepare the validator.
        self.map_by_record_type = {}
        override_fields = []
        override_field_set = set()
        handle_pairs = []
        for map_type in Map.all():
            for field in list(map_type.validate.fields.values()):
                if field.name not in override_field_set:
                    override_fields.append((field.name, field.validate, None))
                    override_field_set.add(field.name)
            handle_pairs.append((map_type.key, map_type.validate))
            self.map_by_record_type[map_type.record_type] = map_type(package)
        copy_val = TaggedStrVal('!copy', r'/[@${}/0-9A-Za-z:._-]*')
        self.copy_record_type = copy_val.record_type
        override_val = TaggedCollectionVal('!override', DeferredVal())
        handle_val = UnionVal(
                (OnTag(copy_val.tag), copy_val),
                (OnTag(override_val.tag), override_val),
                *handle_pairs)
        self.validate = RecordVal([
                ('include', OneOrSeqVal(StrVal(r'[/0-9A-Za-z:._-]+')), None),
                ('context', MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*')), {}),
                ('paths', MapVal(StrVal(r'/[@${}/0-9A-Za-z:._-]*'),
                                 handle_val), {})])
        self.overrides = [
                override_type(package) for override_type in Override.ordered()]

    def __call__(self):
        # Generates a request handler from `urlmap.yaml` configuration.

        # Parse the file and process the `include` section.
        stream = self.open(self.package.abspath('urlmap.yaml'))
        map_spec = self.validate.parse(stream, Loader=MapLoader)
        map_spec = self._include(map_spec)

        # Map URL patterns to handlers.
        segment_map = PathMap()
        for path in sorted(map_spec.paths):
            handle_spec = map_spec.paths[path]
            # Apply external overrides.
            for override in self.overrides:
                handle_spec = override(path, handle_spec)
                if handle_spec is None:
                    break
            if handle_spec is None:
                continue
            map = self.map_by_record_type[type(handle_spec)]
            mask = map.mask(path)
            handler = map(handle_spec, mask, map_spec.context)
            add_handler(segment_map, mask, handler)

        return segment_map

    def _include(self, include_spec, include_path=None, base_spec=None):
        # Flattens include directives in `include_spec`, merges it into
        # `base_spec` and returns a new urlmap record.

        # Current package and directory for resolving relative paths.
        if include_path is None:
            include_path = "%s:/urlmap.yaml" % self.package.name
        current_package, current_path = include_path.split(':', 1)
        current_directory = os.path.dirname(current_path)
        packages = get_packages()

        # A urlmap record to merge into and return.
        if base_spec is None:
            base_spec = include_spec.__clone__(include=None,
                                               context={}, paths={})

        # Files to include.
        if not include_spec.include:
            includes = []
        elif not isinstance(include_spec.include, list):
            includes = [include_spec.include]
        else:
            includes = include_spec.include

        # Merge included urlmaps.
        with guard("Included from:", locate(include_spec).filename):
            for include in includes:
                # Resolve a relative path.
                if ':' not in include:
                    include = "%s:%s" \
                            % (current_package,
                               os.path.join(current_directory, include))
                # Load and merge a nested urlmap.
                stream = self.open(packages.abspath(include))
                spec = self.validate.parse(stream, Loader=MapLoader)
                stream.close()
                base_spec = self._include(spec, include, base_spec)

        # Merge `base_spec` and `include_spec`.
        context = _merge(base_spec.context, include_spec.context)
        paths = base_spec.paths.copy()
        path_by_spec = {}
        # URL cache for detecting duplicate URLs.
        seen = PathMap()
        for path in paths:
            handle_spec = paths[path]
            mapper = self.map_by_record_type.get(type(handle_spec))
            mask = mapper.mask(path)
            add_handler(seen, mask, handle_spec)
            path_by_spec[id(paths[path])] = path
        # Arrange paths so that `!copy` entries are at the end.
        include_paths = [
                path
                for path, flag in
                    sorted([
                        (path, isinstance(
                                    include_spec.paths[path],
                                    self.copy_record_type))
                        for path in include_spec.paths])]
        for path in include_paths:
            handle_spec = include_spec.paths[path]
            # Validate the URL.
            try:
                mask = PathMask(path)
            except ValueError:
                error = Error("Detected ill-formed path:", path)
                error.wrap("While parsing:", locate(handle_spec))
                raise error
            # Copy `!copy` entries.
            if isinstance(handle_spec, self.copy_record_type):
                copy_path = handle_spec.data
                if copy_path not in paths:
                    error = Error("Detected orphaned copy:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    raise error
                base_handle_spec = paths[copy_path]
                handle_spec = base_handle_spec.__clone__(
                        **vars(base_handle_spec))
            # Get the mapper that generates the handler for this record type.
            mapper = self.map_by_record_type.get(type(handle_spec))
            if mapper is not None:
                # Resolve relative paths.
                handle_spec = mapper.abspath(handle_spec, current_package,
                                             current_directory)
                # Complain about duplicate URLs.
                if mask in seen:
                    error = Error("Detected duplicate or ambiguous path:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    error.wrap("And previously in:", locate(seen[mask]))
                    raise error
                paths[path] = handle_spec
                mask = mapper.mask(path)
                add_handler(seen, mask, handle_spec)
                path_by_spec[id(handle_spec)] = path
            else:
                # Merge `!override` records.
                if path not in seen:
                    error = Error("Detected orphaned override:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    raise error
                base_handle_spec = seen[path]
                base_path = path_by_spec[id(base_handle_spec)]
                handle_spec = self._override(
                        base_path, base_handle_spec, path, handle_spec)
                mapper = self.map_by_record_type[type(handle_spec)]
                handle_spec = mapper.abspath(handle_spec, current_package,
                                             current_directory)
                paths[base_path] = handle_spec
                path_by_spec[id(handle_spec)] = base_path
                update = PathMap()
                mask = mapper.mask(base_path)
                add_handler(update, mask, handle_spec)
                seen.update(update)
        return base_spec.__clone__(context=context, paths=paths)

    def _override(self, base_path, handle_spec, override_path, override_spec):
        # Merges fields defined in an `!override` record onto `handle_spec`.
        map = self.map_by_record_type[type(handle_spec)]
        # Reject mis-typed `!override` entries.

        try:
            override_spec = override_spec.resolve(map.validate_override)
        except Error as error:
            error.wrap("While processing override of %s:" % map.key, base_path)
            raise error

        handle_spec = map.override_at(
                handle_spec, override_spec, base_path, override_path)
        if handle_spec is None:
            error = Error(
                    "Detected invalid override of %s:" % map.key, base_path)
            error.wrap("Defined in:", locate(override_spec))
            raise error
        return handle_spec


def add_handler(path_map, mask, handler):
    """ Associate ``handler`` with ``mask`` within the ``path_map``."""
    if isinstance(mask, list):
        for mask in mask:
            path_map.add(mask, handler)
    else:
        path_map.add(mask, handler)


def load_map(package, open=open):
    # Parses `urlmap.yaml` file.
    load = LoadMap(package, open=open)
    return load()


