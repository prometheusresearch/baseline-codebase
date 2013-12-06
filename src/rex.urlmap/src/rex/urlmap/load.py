#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (get_packages, cached, MaybeVal, StrVal, BoolVal, MapVal,
        OneOrSeqVal, RecordVal, UnionVal, OnMatch, locate, Location, Error,
        guard)
from .handle import TreeWalker, TemplateRenderer
import os
import threading
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


class CachingLoad(object):
    # Loads and processes data from a file and caches the result.
    # Reloads the data whenever the file is updated.  Not resistant
    # to race conditions -- use only to permit development without
    # restarting the server.

    # FIXME: API; move to rex.core.

    @classmethod
    @cached
    def instance(cls, *args):
        # Creates and caches a class instance with the given arguments.
        return cls(*args)

    @classmethod
    def do(cls, *args):
        # Loads data from a file.
        instance = cls.instance(*args)
        return instance()

    def __init__(self):
        self.lock = threading.Lock()
        # Set of files used to generate the result.
        self.filenames = []
        # Time of the last update of the files from this set.
        self.last_modified = None
        # Cached data.
        self.result = None

    def __call__(self):
        with self.lock:
            # Check if we can use the cached result.
            if (self.last_modified is not None and
                    all(os.path.exists(filename)
                        for filename in self.filenames)):
                last_modified = max(os.stat(filename).st_mtime
                                    for filename in self.filenames)
                if last_modified == self.last_modified:
                    return self.result
            # If not, generate and cache the result.
            self.filenames = []
            self.last_modified = None
            try:
                self.result = self.load()
            except:
                self.filenames = []
                self.last_modified = None
                raise
            return self.result

    def open(self, filename):
        # Opens the file; notes the time of the last update.
        stream = open(filename)
        if filename not in self.filenames:
            self.filenames.append(filename)
            last_modified = os.fstat(stream.fileno()).st_mtime
            if self.last_modified is None or self.last_modified < last_modified:
                self.last_modified = last_modified
        return stream

    def load(self):
        # Parses the file(s).  Subclasses must reimplement this method.
        raise NotImplementedError("%s.load()" % self.__class__.__name__)


class LoadMap(CachingLoad):
    # Parses `urlmap.yaml` file.

    # Names of query parameters and context variables.
    attr_val = StrVal(r'[A-Za-z_][0-9A-Za-z_]*')
    # URL pattern.
    path_val = StrVal(r'(([/]([0-9A-Za-z._-]+|[$][A-Za-z_][0-9A-Za-z_]*))+'
                      r'[/]?)|[/]')
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
            ('access', StrVal, 'authenticated'),
            ('unsafe', BoolVal, False),
            ('parameters', parameters_val, {}),
            ('context', context_val, {}))
    template_type = template_val.record_type

    # Validator for `!override` records.
    override_val = TaggedRecordVal(u'!override',
            ('template', file_val, None),
            ('access', StrVal, None),
            ('unsafe', BoolVal, None),
            ('parameters', parameters_val, None),
            ('context', context_val, None))
    override_type = override_val.record_type

    # Validator for all handlers.
    handle_val = UnionVal(
            (OnTag(override_val.tag), override_val),
            (template_key, template_val))

    # Validator for the urlmap record.
    validate = RecordVal([
            ('include', OneOrSeqVal(file_val), None),
            ('context', context_val, {}),
            ('paths', MapVal(path_val, handle_val), {}),
    ])

    def __init__(self, package, fallback):
        super(LoadMap, self).__init__()
        self.package = package
        self.fallback = fallback

    def load(self):
        # Generates a request handler from `urlmap.yaml` configuration.

        # Parse the file and process the `include` section.
        stream = self.open(self.package.abspath('urlmap.yaml'))
        map_spec = self.validate.parse(stream)
        map_spec = self._include(map_spec)

        # Segment tree with handlers at the leaves; `'*'` denotes any segment;
        # `None` is a leaf handler.
        segment_map = {}
        # Iterate over `paths` dictionary.
        for path in sorted(map_spec.paths):
            # Split the URL into segments, find segment labels and add a path
            # to the segment tree.
            segments = path[1:].split('/')
            labels = []
            mapping = segment_map
            for segment in segments:
                if segment.startswith('$'):
                    label = segment[1:]
                    key = '*'
                else:
                    label = None
                    key = segment
                labels.append(label)
                mapping = mapping.setdefault(key, {})
            assert None not in mapping
            handle_spec = map_spec.paths[path]
            # Generate a template handler.
            if isinstance(handle_spec, self.template_type):
                validates = {}
                context = self._merge(map_spec.context, handle_spec.context)
                handler = TemplateRenderer(
                        labels=labels,
                        template=handle_spec.template,
                        access=handle_spec.access,
                        unsafe=handle_spec.unsafe,
                        parameters=handle_spec.parameters,
                        validates=validates,
                        context=context)
            mapping[None] = handler
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
                spec = self.validate.parse(stream)
                stream.close()
                base_spec = self._include(spec, include, base_spec)

        # Merge `base_spec` and `include_spec`.
        context = self._merge(base_spec.context, include_spec.context)
        paths = base_spec.paths.copy()
        # URL cache for detecting duplicate URLs.
        seen = {}
        for path in paths:
            mask = tuple(segment if not segment.startswith('$') else '*'
                         for segment in path[1:].split('/'))
            seen[mask] = paths[path]
        for path in sorted(include_spec.paths):
            handle_spec = include_spec.paths[path]
            # Resolve relative paths.
            handle_spec = self._resolve(handle_spec, current_path)
            # Merge `!override` records.
            if isinstance(handle_spec, self.override_type):
                if path not in paths:
                    error = Error("Detected orphaned override:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    raise error
                paths[path] = self._override(paths[path], handle_spec)
            else:
                # Complain about duplicate URLs.
                mask = tuple(segment if not segment.startswith('$') else '*'
                             for segment in path[1:].split('/'))
                if mask in seen:
                    error = Error("Detected duplicate or ambiguous path:", path)
                    error.wrap("Defined in:", locate(handle_spec))
                    error.wrap("And previously in:", locate(seen[mask]))
                    raise error
                paths[path] = handle_spec
                seen[mask] = handle_spec

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

    def _override(self, handle_spec, override_spec):
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


load_map = LoadMap.do


