#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (get_packages, cached, MaybeVal, StrVal, BoolVal, MapVal,
        OneOrSeqVal, RecordVal, SwitchVal, locate, Error, guard)
from .handle import TreeWalker, TemplateRenderer
import os
import threading


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

    # Query parameters and context variables.
    attr_val = StrVal(r'[A-Za-z_][0-9A-Za-z_]*')
    # URL pattern.
    path_val = StrVal(r'(([/]([0-9A-Za-z._-]+|[$][A-Za-z_][0-9A-Za-z_]*))+'
                      r'[/]?)|[/]')
    # File pattern.
    file_val = StrVal(r'[/0-9A-Za-z:._-]+')

    # Validator for template records.
    template_key = 'template'
    template_val = RecordVal([
            ('template', file_val),
            ('access', StrVal(), 'authenticated'),
            ('unsafe', BoolVal(), False),
            ('parameters', MapVal(attr_val,
                                  MaybeVal(StrVal())), {}),
            ('context', MapVal(attr_val), {}),
    ])
    template_type = template_val.record_type

    # Validator for the urlmap record.
    validate = RecordVal([
            ('include', OneOrSeqVal(file_val), None),
            ('context', MapVal(attr_val), {}),
            ('paths', MapVal(path_val,
                             SwitchVal({
                                 template_key: template_val})), {}),
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
            # Generate a template handler.
            template_spec = map_spec.paths[path]
            template = template_spec.template
            access = template_spec.access
            unsafe = template_spec.unsafe
            parameters = template_spec.parameters
            validates = {}
            context = self._merge(map_spec.context, template_spec.context)
            mapping[None] = TemplateRenderer(
                                labels=labels,
                                template=template,
                                access=access,
                                unsafe=unsafe,
                                parameters=parameters,
                                validates=validates,
                                context=context)
        # Generate the main handler.
        return TreeWalker(segment_map, self.fallback)

    def _include(self, include_spec, include_path=None, base_spec=None):
        # Flattens include directives in `include_spec`, merges it into
        # `base_spec` and returns a new urlmap record.

        # Base package and directory for resolving relative paths.
        if include_path is None:
            include_path = "%s:/urlmap.yaml" % self.package.name
        include_package, include_path = include_path.split(':', 1)
        include_path = os.path.dirname(include_path)
        packages = get_packages()

        # A urlmap record to merge into and return.
        if base_spec is None:
            base_spec = include_spec.__clone__(include=None,
                                               context={}, paths={})

        # Paths to include.
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
                    include = "%s:%s" % (include_package,
                                         os.path.join(include_path, include))
                # Load and merge a nested urlmap.
                stream = self.open(packages.abspath(include))
                spec = self.validate.parse(stream)
                stream.close()
                base_spec = self._include(spec, include, base_spec)

        # Merge `include_spec` into `base_spec`.
        context = self._merge(base_spec.context, include_spec.context)
        paths = base_spec.paths.copy()
        seen = {}
        for path in paths:
            mask = tuple(segment if not segment.startswith('$') else '*'
                         for segment in path[1:].split('/'))
            seen[mask] = paths[path]
        for path in sorted(include_spec.paths):
            path_spec = include_spec.paths[path]
            # Detect duplicate URLs.
            mask = tuple(segment if not segment.startswith('$') else '*'
                         for segment in path[1:].split('/'))
            if mask in seen:
                error = Error("Detected duplicate or ambiguous path:", path)
                error.wrap("Defined in:", locate(path_spec))
                error.wrap("And previously in:", locate(seen[mask]))
                raise error
            # Resolve relative paths.
            if isinstance(path_spec, self.template_type):
                if ':' not in path_spec.template:
                    template = "%s:%s" % (include_package,
                                          os.path.join(include_path,
                                                       path_spec.template))
                    path_spec = path_spec.__clone__(template=template)
            paths[path] = path_spec
            seen[mask] = path_spec

        return base_spec.__clone__(context=context, paths=paths)

    def _merge(self, *contexts):
        # Merge contexts.
        merged = {}
        for context in contexts:
            for key in context:
                value = context[key]
                if (isinstance(value, dict) and
                        isinstance(getitem(merged, key), dict)):
                    value = self._merge(merged[key], value)
                merged[key] = value
        return merged


load_map = LoadMap.do


