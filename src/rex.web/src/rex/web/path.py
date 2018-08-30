#
# Copyright (c) 2014, Prometheus Research, LLC
#


import urllib.request, urllib.parse, urllib.error


# Pattern that matches any segment.
STAR = object()
# Pattern that matches one or more arbitrary segments.
DOUBLE_STAR = object()
# Value to return when the path does not match any mask.
MISSING = object()


class PathMask(object):
    """
    Pattern for matching URL segments.

    `text`
        URL path or pattern starting with ``/``.  Each URL segment can
        be one of:

        - a literal value, e.g. ``/individual``;
        - a wildcard segment ``/*`` or ``/**`` matching respectively any
          segment or any sequence of segments;
        - a labeled segment in the form ``/$label`` or ``/$label:pattern``;
          if ``pattern`` is not set, ``*`` is assumed.  Syntax ``/{label}``
          or ``/{label:pattern}`` is also accepted.

        Path ``'*'`` is interpreted as ``'/**'``.

    `guard`
        A predicate function which allows you to enforce arbitrary conditions
        on the path.
    """

    @staticmethod
    def split(text):
        # Parses the URL pattern into a list of labels and segment patterns.

        # '*' is interpreted as '/**'.
        if text == '*':
            return [None], [DOUBLE_STAR]

        if not text.startswith('/'):
            raise ValueError("path mask must start with /: %r" % text)

        # Only one `**` in the URL is allowed.
        has_double_star = False
        # Extract labels and segment patterns.
        labels = []
        patterns = []
        for pattern in text[1:].split('/'):
            label = None
            # We permit `$label`, `{label}` and `${label}`.
            if pattern.startswith('$') or pattern.startswith('{'):
                if pattern.startswith('$'):
                    pattern = pattern[1:]
                if pattern.startswith('{'):
                    if not pattern.endswith('}'):
                        raise ValueError("invalid label: %r" % pattern)
                    pattern = pattern[1:-1]
                # `:` separates the label and the pattern.
                if ':' in pattern:
                    label, pattern = pattern.split(':', 1)
                else:
                    label = pattern
                    pattern = '*'
            # Replace `*` and `**` with respective singletons.
            if pattern == '*':
                pattern = STAR
            elif pattern == '**':
                if has_double_star:
                    raise ValueError("symbol ** can only be used once: %r"
                                     % text)
                pattern = DOUBLE_STAR
                has_double_star = True
            labels.append(label)
            patterns.append(pattern)

        return labels, patterns

    def __init__(self, text, guard=None):
        self.text = text
        self.guard = guard
        self.labels, self.patterns = self.split(text)

    def __call__(self, path):
        """
        Extracts labeled segments.

        Returns a dictionary that maps the labels to URL segments.
        """
        assignments = {}
        if path and not path.startswith('/'):
            raise ValueError("path must start with /: %r" % path)
        segments = path.split('/')[1:]
        length = len(segments)
        if length < len(self.patterns):
            raise ValueError("path does not match the mask: %r" % path)
        for label, pattern in zip(self.labels, self.patterns):
            if pattern is DOUBLE_STAR:
                cut = length-len(self.patterns)+1
                value = "/".join(segments[:cut])
                segments = segments[cut:]
            elif pattern is STAR:
                value = segments.pop(0)
            else:
                value = segments.pop(0)
                if value != pattern:
                    raise ValueError("path does not match the mask: %r" % path)
            if label:
                assignments[label] = urllib.parse.unquote(value)
        if segments:
            raise ValueError("path does not match the mask: %r" % path)
        return assignments

    def __str__(self):
        if self.guard is None:
            return self.text
        else:
            return "%s | %s" % (self.text, self.guard)

    def __repr__(self):
        if self.guard is None:
            return "%s(%r)" % (self.__class__.__name__, self.text)
        else:
            return "%s(%r, %r)" % (self.__class__.__name__,
                                   self.text, self.guard)


class PathMap(object):
    """
    Collection of URL patterns.
    """

    def __init__(self):
        # Maps patterns to targets; has the structure:
        #   <pattern> | STAR | DOUBLE_STAR -> <subtree>
        #   None -> [(<guard>, <target>)]
        self.tree = {}

    def __bool__(self):
        return bool(self.tree)

    def add(self, mask, target):
        """
        Adds the URL pattern with the given target to the collection.
        """
        if not isinstance(mask, PathMask):
            mask = PathMask(mask)
        tree = self.tree
        for pattern in mask.patterns:
            tree = tree.setdefault(pattern, {})
        guards = tree.setdefault(None, [])
        for guard, guard_target in guards:
            if mask.guard == guard:
                raise ValueError("multiple targets %r and %r for path mask: %s"
                                 % (guard_target, target, mask))
        guards.append((mask.guard, target))

    def update(self, other):
        """
        Merges another collection of URL patterns.
        """
        todo = [(self.tree, other.tree)]
        while todo:
            tree, other_tree = todo.pop()
            for key in other_tree:
                if key not in tree:
                    tree[key] = other_tree[key]
                elif key is None:
                    tree[key] = other_tree[key]+tree[key]
                else:
                    todo.append((tree[key], other_tree[key]))

    def get(self, path, default=None):
        """
        Matches the given path against the mask collection; returns the target
        of the most specific mask or `default`.

        Also accepts a :class:`PathMask` instance; in which case, returns the
        target defined for the mask.
        """
        # If `PathMask` is given, find its target.
        if isinstance(path, PathMask):
            subtree = self.tree
            for pattern in path.patterns:
                if pattern not in subtree:
                    return default
                subtree = subtree[pattern]
            for guard, target in subtree.get(None, []):
                if path.guard == guard:
                    return target
            return default
        # Otherwise, match the path against the pattern tree.
        if path and not path.startswith('/'):
            raise ValueError("path must start with /: %r" % path)
        segments = path.split('/')[1:]
        subtrees = [self.tree]
        for segment in segments:
            new_subtrees = []
            for tree in subtrees:
                if segment in tree:
                    new_subtrees.append(tree[segment])
                if STAR in tree and len(segment) > 0:
                    new_subtrees.append(tree[STAR])
                if DOUBLE_STAR in tree:
                    new_subtrees.append(tree[DOUBLE_STAR])
                    new_subtrees.append({DOUBLE_STAR: tree[DOUBLE_STAR]})
            subtrees = new_subtrees
        for subtree in subtrees:
            for guard, target in subtree.get(None, []):
                if guard is None or guard(path):
                    return target
        return default

    def __getitem__(self, path):
        """
        Matches the path against the collection; returns the target
        corresponding to the most specific matching mask.
        """
        value = self.get(path, MISSING)
        if value is MISSING:
            raise ValueError("path does not match any mask: %s" % path)
        return value

    def __contains__(self, path):
        """
        Checks if the path matches any mask in the collection.
        """
        return self.get(path, MISSING) is not MISSING

    def __iter__(self):
        """
        Iterates over all masks in the collection.
        """
        todo = [('', self.tree)]
        while todo:
            prefix, subtree = todo.pop(0)
            segments = sorted(segment for segment in subtree
                              if isinstance(segment, str))
            for segment in segments:
                path = prefix + '/' + segment
                todo.append((path, subtree[segment]))
            for key, segment in [(STAR, '*'), (DOUBLE_STAR, '**')]:
                if key in subtree:
                    path = prefix + '/' + segment
                    todo.append((path, subtree[key]))
            if None in subtree:
                path = prefix or '/'
                for guard, target in subtree[None]:
                    yield PathMask(path, guard)

    def completes(self, path):
        """
        Checks if `<path>/` is in the collection.
        """
        if path.endswith('/'):
            return False
        return self.get(path+'/', MISSING) is not MISSING


