#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


import os.path
import json
import pkg_resources


class Generate(object):
    # Builds a generated file.  This is an abstract interface; to
    # create a generator for a specific URL scheme, make a subclass,
    # set `scheme` attribute, override `__call__()` method and optionally
    # `watch()` method.

    scheme = None

    @classmethod
    def matches(cls, url):
        # Tests if the given URL can be handled by this generator.
        url_scheme = url.split(':', 1)[0]
        if cls.scheme:
            if isinstance(cls.scheme, (list, tuple)):
                return (url_scheme in cls.scheme)
            else:
                return (url_scheme == cls.scheme)
        return False

    @classmethod
    def lookup(cls, url):
        # Finds a generator for the URL.
        if cls.matches(url):
            return cls
        for subclass in cls.__subclasses__():
            generate_type = subclass.lookup(url)
            if generate_type is not None:
                return generate_type
        return None

    def __init__(self, dist, target, url):
        # `pkg_resources.Distribution` that requested the generated file.
        self.dist = dist
        # Directory where to store the bundle.
        self.target = target
        # URL or bundle description.
        self.url = url

    def __call__(self):
        # Builds the bundle.
        raise NotImplementedError()

    def watch(self):
        # Starts a server to watch source files and rebuild the bundle
        # whenever any of them changes.  Must return a function that
        # terminates the server.
        return None


def watch(*dists):
    # For the given list of distributions, starts a watch server
    # that rebuilds generated files when their sources are changed.
    terminators = []
    for dist in dists:
        if not isinstance(dist, pkg_resources.Distribution):
            dist = pkg_resources.get_distribution(dist)
        if not dist.has_metadata('rex_static.txt'):
            continue
        static = dist.get_metadata('rex_static.txt')
        # Ignore distributions that are not installed with
        # `python setup.py develop`.
        if not os.path.islink(static):
            continue
        if not dist.has_metadata('rex_bundle.txt'):
            continue
        bundle = json.loads(dist.get_metadata('rex_bundle.txt'))
        for base in sorted(bundle):
            target = os.path.abspath(os.path.join(static, base))
            if not os.path.exists(target):
                continue
            for url in bundle[base]:
                generate_type = Generate.lookup(url)
                assert generate_type is not None
                generate = generate_type(dist, target, url)
                terminator = generate.watch()
                if terminator is not None:
                    terminators.append(terminator)
    if not terminators:
        return None
    def terminate_all():
        for terminator in terminators:
            terminator()
    return terminate_all


