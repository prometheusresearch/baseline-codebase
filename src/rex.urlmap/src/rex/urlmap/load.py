#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (
        get_packages, get_settings, cached, autoreload, ValidatingLoader,
        MaybeVal, StrVal, BoolVal, MapVal, OneOrSeqVal, RecordVal, UnionVal,
        OnMatch, locate, Location, Error, guard)
from rex.web import PathMask, PathMap
from rex.port import GrowVal, Port
from .handle import TreeWalker, TemplateRenderer, QueryRenderer, PortRenderer
import os
import yaml


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
    # Add support for !setting tag.

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

    # Names of query parameters and context variables.
    attr_val = StrVal(r'[A-Za-z_][0-9A-Za-z_]*')
    # URL pattern.
    path_val = StrVal(r'/[${}/0-9A-Za-z:._-]*')
    # Filename pattern.
    file_val = StrVal(r'[/0-9A-Za-z:._-]+')
    # Template variables.
    context_val = MapVal(attr_val)
    # Query parameters.
    parameters_val = MapVal(attr_val, MaybeVal(StrVal))

    # Validator for template records.
    template_key = 'template'
    template_val = RecordVal(
            ('template', file_val),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
            ('parameters', parameters_val, {}),
            ('context', context_val, {}))
    template_type = template_val.record_type

    query_key = 'query'
    query_val = RecordVal(
            ('query', StrVal),
            ('parameters', parameters_val, {}),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False))
    query_type = query_val.record_type

    port_key = 'port'
    port_val = RecordVal(
            ('port', GrowVal),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False))
    port_type = port_val.record_type

    # Validator for `!override` records.
    override_val = TaggedRecordVal(u'!override',
            ('template', file_val, None),
            ('query', StrVal, None),
            ('port', GrowVal, None),
            ('access', StrVal, None),
            ('unsafe', BoolVal, None),
            ('parameters', parameters_val, None),
            ('context', context_val, None))
    override_type = override_val.record_type

    # Validator for all handlers.
    handle_val = UnionVal(
            (OnTag(override_val.tag), override_val),
            (template_key, template_val),
            (query_key, query_val),
            (port_key, port_val))

    # Validator for the urlmap record.
    validate = RecordVal([
            ('include', OneOrSeqVal(file_val), None),
            ('context', context_val, {}),
            ('paths', MapVal(path_val, handle_val), {}),
    ])

    def __init__(self, package, fallback, open=open):
        super(LoadMap, self).__init__()
        self.package = package
        self.fallback = fallback
        self.open = open

    def __call__(self):
        # Generates a request handler from `urlmap.yaml` configuration.

        # Parse the file and process the `include` section.
        stream = self.open(self.package.abspath('urlmap.yaml'))
        map_spec = self.validate.parse(stream, Loader=MapLoader)
        map_spec = self._include(map_spec)

        # Maps URL patterns to handlers.
        segment_map = PathMap()
        # Iterate over `paths` dictionary.
        for path in sorted(map_spec.paths):
            handle_spec = map_spec.paths[path]
            path = PathMask(path)
            # Generate a template handler.
            if isinstance(handle_spec, self.template_type):
                validates = {}
                access = handle_spec.access or self.package.name
                context = self._merge(map_spec.context, handle_spec.context)
                handler = TemplateRenderer(
                        path=path,
                        template=handle_spec.template,
                        access=access,
                        unsafe=handle_spec.unsafe,
                        parameters=handle_spec.parameters,
                        validates=validates,
                        context=context)
            elif isinstance(handle_spec, self.query_type):
                access = handle_spec.access or self.package.name
                handler = QueryRenderer(
                        path=path,
                        query=handle_spec.query,
                        parameters=handle_spec.parameters,
                        access=access,
                        unsafe=handle_spec.unsafe)
            elif isinstance(handle_spec, self.port_type):
                access = handle_spec.access or self.package.name
                port = Port(handle_spec.port)
                handler = PortRenderer(
                        port=port,
                        access=access,
                        unsafe=handle_spec.unsafe)
            else:
                raise NotImplementedError()
            segment_map.add(path, handler)
        # Generate the main handler.
        return TreeWalker(segment_map, self.fallback)

    def _include(self, include_spec, include_path=None, base_spec=None):
        # Flattens include directives in `include_spec`, merges it into
        # `base_spec` and returns a new urlmap record.

        # Current package and directory for resolving relative paths.
        if include_path is None:
            include_path = "%s:/urlmap.yaml" % self.package.name
        current_package, current_path = include_path.split(':', 1)
        current_path = (current_package, os.path.dirname(current_path))
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
                include = self._resolve(include, current_path)
                # Load and merge a nested urlmap.
                stream = self.open(packages.abspath(include))
                spec = self.validate.parse(stream, Loader=MapLoader)
                stream.close()
                base_spec = self._include(spec, include, base_spec)

        # Merge `base_spec` and `include_spec`.
        context = self._merge(base_spec.context, include_spec.context)
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
            # Resolve relative paths.
            handle_spec = self._resolve(handle_spec, current_path)
            # Merge `!override` records.
            if isinstance(handle_spec, self.override_type):
                if path not in paths:
                    error = Error("Detected orphaned override:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    raise error
                paths[path] = self._override(path, paths[path], handle_spec)
            else:
                # Complain about duplicate URLs.
                if mask in seen:
                    error = Error("Detected duplicate or ambiguous path:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    error.wrap("And previously in:", locate(seen[mask]))
                    raise error
                paths[path] = handle_spec
                seen.add(path, handle_spec)

        return base_spec.__clone__(context=context, paths=paths)

    def _resolve(self, spec, current_path):
        # Resolves relative paths.
        if isinstance(spec, str):
            if ':' not in spec:
                current_package, current_directory = current_path
                spec = "%s:%s" % (current_package,
                                  os.path.join(current_directory, spec))
        elif isinstance(spec, (self.template_type, self.override_type)):
            template = self._resolve(spec.template, current_path)
            spec = spec.__clone__(template=template)
        return spec

    def _override(self, path, handle_spec, override_spec):
        # Merges fields defined in an `!override` record onto `handle_spec`.
        if isinstance(handle_spec, self.template_type):
            if override_spec.template is not None:
                handle_spec = handle_spec.__clone__(
                        template=override_spec.template)
            if override_spec.access is not None:
                handle_spec = handle_spec.__clone__(
                        access=override_spec.access)
            if override_spec.unsafe is not None:
                handle_spec = handle_spec.__clone__(
                        unsafe=override_spec.unsafe)
            if override_spec.parameters is not None:
                parameters = self._merge(handle_spec.parameters,
                                         override_spec.parameters)
                handle_spec = handle_spec.__clone__(parameters=parameters)
            if override_spec.context is not None:
                context = self._merge(handle_spec.context,
                                      override_spec.context)
                handle_spec = handle_spec.__clone__(context=context)
            if (override_spec.query is not None or
                override_spec.port is not None):
                error = Error("Detected invalid override"
                              " of template:", path)
                error.wrap("Defined in:", locate(override_spec))
                raise error
        elif isinstance(handle_spec, self.query_type):
            if override_spec.query is not None:
                handle_spec = handle_spec.__clone__(
                        query=override_spec.query)
            if override_spec.parameters is not None:
                parameters = self._merge(handle_spec.parameters,
                                         override_spec.parameters)
                handle_spec = handle_spec.__clone__(parameters=parameters)
            if override_spec.access is not None:
                handle_spec = handle_spec.__clone__(
                        access=override_spec.access)
            if override_spec.unsafe is not None:
                handle_spec = handle_spec.__clone__(
                        unsafe=override_spec.unsafe)
            if (override_spec.template is not None or
                override_spec.port is not None or
                override_spec.context is not None):
                error = Error("Detected invalid override"
                              " of query:", path)
                error.wrap("Defined in:", locate(override_spec))
                raise error
        elif isinstance(handle_spec, self.port_type):
            if override_spec.port is not None:
                port = []
                for spec in [handle_spec.port, override_spec.port]:
                    if isinstance(spec, list):
                        port.extend(spec)
                    else:
                        port.append(spec)
                handle_spec = handle_spec.__clone__(
                        port=port)
            if override_spec.access is not None:
                handle_spec = handle_spec.__clone__(
                        access=override_spec.access)
            if override_spec.unsafe is not None:
                handle_spec = handle_spec.__clone__(
                        unsafe=override_spec.unsafe)
            if (override_spec.template is not None or
                override_spec.query is not None or
                override_spec.parameters is not None or
                override_spec.context is not None):
                error = Error("Detected invalid override"
                              " of port:", path)
                error.wrap("Defined in:", locate(override_spec))
                raise error
        return handle_spec

    def _merge(self, *contexts):
        # Merge context dictionaries.
        merged = {}
        for context in contexts:
            for key in context:
                value = context[key]
                if (isinstance(value, dict) and
                        isinstance(merged.get(key), dict)):
                    value = self._merge(merged[key], value)
                merged[key] = value
        return merged


@autoreload
def load_map(package, fallback, open=open):
    # Parses `urlmap.yaml` file.
    load = LoadMap(package, fallback, open=open)
    return load()


