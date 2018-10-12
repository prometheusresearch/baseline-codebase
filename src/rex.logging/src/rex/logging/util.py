#
# Copyright (c) 2017, Prometheus Research, LLC
#

from copy import copy


__all__ = (
    'merge_dicts',
)


def merge_dicts(first, second):
    merged = copy(first)

    for key, value in list(second.items()):
        if key not in merged:
            merged[key] = value
        else:
            if isinstance(merged[key], dict) and isinstance(value, dict):
                merged[key] = merge_dicts(merged[key], value)
            else:
                merged[key] = value

    return merged

