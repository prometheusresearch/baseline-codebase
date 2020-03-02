#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
This package provides the foundation of the RexDB platform: initialization,
extension mechanism, configuration management, base exception object,
validating utilities.
"""


from . import testing
from .application import Rex, LatentRex, Initialize
from .cache import cached, autoreload
from .context import get_rex
from .error import Error, guard, get_sentry
from .extension import Extension, DocEntry
from .package import (
    Package, PythonPackage, ModulePackage, StaticPackage, SandboxPackage,
    PackageCollection, get_packages)
from .setting import Setting, SettingCollection, get_settings
from .validate import (
    ValidatingLoader, RexJSONEncoder, Validate, AnyVal, ProxyVal, MaybeVal,
    OneOfVal, StrVal, UStrVal, ChoiceVal, UChoiceVal, BoolVal, IntVal, UIntVal,
    PIntVal, FloatVal, SeqVal, OneOrSeqVal, MapVal, OMapVal, RecordVal,
    OpenRecordVal, SwitchVal, UnionVal, IncludeKeyVal, OnMatch, OnScalar,
    OnSeq, OnMap, OnField, Record, RecordField, Location, set_location, locate,
    DateVal, TimeVal, DateTimeVal, StrFormatVal, PathVal)
from .wsgi import WSGI, get_wsgi


