#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import cached, get_packages
from .handler import PathHandler


@cached
def get_mount():
    mount = {}
    for package in get_packages():
        if not (package.exists('www') or PathHandler.by_package(package.name)):
            continue
        if not mount:
            segment = ''
        else:
            segment = package.name
            if '.' in segment:
                segment = segment.split('.', 1)[1]
            segment = segment.replace('.', '-').replace('_', '-')
        mount[package.name] = segment
    return mount


