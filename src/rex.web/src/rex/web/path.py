#
# Copyright (c) 2014, Prometheus Research, LLC
#


import urllib


class Symbol(object):
    # Represents `*` and `**` singletons.

    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return str(self.text)


# Matches any segment.
STAR = Symbol('*')
# Matches one or more segments.
DOUBLE_STAR = Symbol('**')


class PathMask(object):
    """
    Pattern for matching URL segments.

    `text`
        URL pattern of the form ``'/segment1/segment2/...'``.

        Segments ``*`` and ``**`` have a special meaning, they match any
        segment or any sequence of segments respectively.

        A labeled segment has the form ``$label:segment``.  A segment
        ``$label`` is equivalent to ``$label:*``.
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

    def __init__(self, text):
        self.text = text
        self.labels, self.patterns = self.split(text)

    def __call__(self, path):
        """
        Extracts values of segment labels.
        """
        assignments = {}
        if not path.startswith('/'):
            raise ValueError("path must start with /: %r" % path)
        segments = path[1:].split('/')
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
                assignments[label] = urllib.unquote(value)
        if segments:
            raise ValueError("path does not match the mask: %r" % path)
        return assignments

    def __str__(self):
        return self.text

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.text)


class PathMap(object):
    """
    Collection of URL patterns.
    """

    def __init__(self):
        self.tree = {}

    def add(self, mask, target):
        """
        Adds a URL pattern to the collection with the given target.
        """
        if not isinstance(mask, PathMask):
            mask = PathMask(mask)
        tree = self.tree
        for pattern in mask.patterns:
            tree = tree.setdefault(pattern, {})
        if None in tree:
            raise ValueError("duplicate path mask: %s" % mask)
        tree[None] = target

    def get(self, path, default=None):
        """
        Matches the given path against the mask collection; returns the target
        of the most specific mask or `default`.
        """
        if not path.startswith('/'):
            raise ValueError("path must start with /: %r" % path)
        segments = path[1:].split('/')
        subtrees = [self.tree]
        for segment in segments:
            new_subtrees = []
            for tree in subtrees:
                if segment in tree:
                    new_subtrees.append(tree[segment])
                if STAR in tree:
                    new_subtrees.append(tree[STAR])
                if DOUBLE_STAR in tree:
                    new_subtrees.append(tree[DOUBLE_STAR])
                    new_subtrees.append({DOUBLE_STAR: tree[DOUBLE_STAR]})
            subtrees = new_subtrees
        for tree in subtrees:
            if None in tree:
                return tree[None]
        return default


