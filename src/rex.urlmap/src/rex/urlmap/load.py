#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (
        get_packages, get_settings, ValidatingLoader, StrVal, MapVal,
        OneOrSeqVal, RecordVal, UnionVal, OnMatch, locate, Location, Error,
        guard)
from rex.web import PathMask, PathMap
from .map import Map
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


class OnTag(OnMatch):

    def __init__(self, tag):
        self.tag = tag

    def __call__(self, data):
        return (isinstance(data, yaml.Node) and data.tag == self.tag)

    def __str__(self):
        return "%s record" % self.tag

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.tag)


class TaggedRecordVal(RecordVal):
    # Like `RecordVal`, but expects a special YAML tag.

    def __init__(self, tag, *fields):
        super(TaggedRecordVal, self).__init__(*fields)
        self.tag = tag

    def construct(self, loader, node):
        if node.tag == self.tag:
            # Rewrite the node for `RecordVal`.
            if (isinstance(node, yaml.ScalarNode) and
                    node.value == u''):
                node = yaml.ScalarNode(u'tag:yaml.org,2002:null', node.value,
                        node.start_mark, node.end_mark, node.style)
            elif isinstance(node, yaml.MappingNode):
                node = yaml.MappingNode(u'tag:yaml.org,2002:map', node.value,
                        node.start_mark, node.end_mark, node.flow_style)
        return super(TaggedRecordVal, self).construct(loader, node)

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__, self.tag,
                               ", ".join(repr(field) for field in self.fields))


class MapLoader(ValidatingLoader):
    # Add support for `!setting` tag.

    def construct_object(self, node, deep=False):
        if node.tag != u'!setting':
            return super(MapLoader, self).construct_object(node, deep)
        if not isinstance(node, yaml.ScalarNode):
            raise yaml.constructor.ConstructorError(None, None,
                    "expected a setting name, but found %s" % node.id,
                    node.start_mark)
        settings = get_settings()
        with guard("While parsing:", Location.from_node(node)):
            if not hasattr(settings, node.value):
                raise Error("Got unknown setting:", node.value.encode('utf-8'))
            value = getattr(settings, node.value)
            if self.validate is not None:
                value = self.validate(value)
        return value


class LoadMap(object):
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
            for field in map_type.validate.fields.values():
                if field.name not in override_field_set:
                    override_fields.append((field.name, field.validate, None))
                    override_field_set.add(field.name)
            handle_pairs.append((map_type.key, map_type.validate))
            self.map_by_record_type[map_type.record_type] = map_type(package)
        override_val = TaggedRecordVal(u'!override', override_fields)
        handle_val = UnionVal(
                (OnTag(override_val.tag), override_val),
                *handle_pairs)
        self.validate = RecordVal([
                ('include', OneOrSeqVal(StrVal(r'[/0-9A-Za-z:._-]+')), None),
                ('context', MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*')), {}),
                ('paths', MapVal(StrVal(r'/[${}/0-9A-Za-z:._-]*'),
                                 handle_val), {})])

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
            map = self.map_by_record_type[type(handle_spec)]
            path = map.mask(path)
            handler = map(handle_spec, path, map_spec.context)
            if isinstance(path, list):
                for path in path:
                    segment_map.add(path, handler)
            else:
                segment_map.add(path, handler)

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
        # URL cache for detecting duplicate URLs.
        seen = PathMap()
        for path in paths:
            seen.add(path, paths[path])
        for path in sorted(include_spec.paths):
            handle_spec = include_spec.paths[path]
            # Validate the URL.
            try:
                mask = PathMask(path)
            except ValueError:
                error = Error("Detected ill-formed path:", path)
                error.wrap("While parsing:", locate(handle_spec))
                raise error
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
                seen.add(path, handle_spec)
            else:
                # Merge `!override` records.
                if path not in paths:
                    error = Error("Detected orphaned override:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    raise error
                handle_spec = self._override(path, paths[path], handle_spec)
                mapper = self.map_by_record_type[type(handle_spec)]
                handle_spec = mapper.abspath(handle_spec, current_package,
                                             current_directory)
                paths[path] = handle_spec
        return base_spec.__clone__(context=context, paths=paths)

    def _override(self, path, handle_spec, override_spec):
        # Merges fields defined in an `!override` record onto `handle_spec`.
        map = self.map_by_record_type[type(handle_spec)]
        # Reject mis-typed `!override` entries.
        for key, value in sorted(vars(override_spec).items()):
            if value is not None:
                if key not in map.validate.fields:
                    error = Error("Detected invalid override"
                                  " of %s:" % map.key, path)
                    error.wrap("Defined in:", locate(override_spec))
                    raise error
        handle_spec = map.override(handle_spec, override_spec)
        return handle_spec


def load_map(package, open=open):
    # Parses `urlmap.yaml` file.
    load = LoadMap(package, open=open)
    return load()


