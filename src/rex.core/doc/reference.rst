**************************
  REX.CORE API Reference
**************************

.. contents:: Table of Contents

.. automodule:: rex.core


Application object
==================

.. autoclass:: rex.core.Rex
   :special-members: __call__
.. autoclass:: rex.core.LatentRex
.. autofunction:: rex.core.get_rex
.. autoclass:: rex.core.Initialize
   :special-members: __call__


Caching
=======

.. autofunction:: rex.core.cached
.. autofunction:: rex.core.autoreload


Extensions
==========

.. autoclass:: rex.core.Extension
.. autoclass:: rex.core.DocEntry


Packages
========

.. autoclass:: rex.core.Package
.. autoclass:: rex.core.PythonPackage
.. autoclass:: rex.core.ModulePackage
.. autoclass:: rex.core.StaticPackage
.. autoclass:: rex.core.SandboxPackage
.. autoclass:: rex.core.PackageCollection
   :special-members: __iter__, __len__, __getitem__, __contains__
.. autofunction:: rex.core.get_packages


Settings
========

.. autoclass:: rex.core.Setting
.. autoclass:: rex.core.SettingCollection
.. autofunction:: rex.core.get_settings()

Available settings
------------------

.. autorex:: rex.core.Setting
   :package: rex.core


WSGI
====

.. autoclass:: rex.core.WSGI
.. autofunction:: rex.core.get_wsgi


Errors
======

.. autoexception:: rex.core.Error
   :special-members: __call__
.. autoclass:: guard
.. autofunction:: get_sentry


Validators
==========

.. autoclass:: rex.core.Validate
   :special-members: __call__
.. autoclass:: rex.core.AnyVal
.. autoclass:: rex.core.ProxyVal
   :special-members: __nonzero__
.. autoclass:: rex.core.MaybeVal
.. autoclass:: rex.core.OneOfVal
.. autoclass:: rex.core.StrVal
.. autoclass:: rex.core.ChoiceVal
.. autoclass:: rex.core.BoolVal
.. autoclass:: rex.core.IntVal
.. autoclass:: rex.core.UIntVal
.. autoclass:: rex.core.PIntVal
.. autoclass:: rex.core.FloatVal
.. autoclass:: rex.core.DateVal
.. autoclass:: rex.core.TimeVal
.. autoclass:: rex.core.DateTimeVal
.. autoclass:: rex.core.SeqVal
.. autoclass:: rex.core.OneOrSeqVal
.. autoclass:: rex.core.MapVal
.. autoclass:: rex.core.OMapVal
.. autoclass:: rex.core.RecordVal
.. autoclass:: rex.core.OpenRecordVal
.. autoclass:: rex.core.SwitchVal
.. autoclass:: rex.core.UnionVal
.. autoclass:: rex.core.IncludeKeyVal
.. autoclass:: rex.core.OnMatch
   :special-members: __call__, __str__
.. autoclass:: rex.core.OnScalar
.. autoclass:: rex.core.OnSeq
.. autoclass:: rex.core.OnMap
.. autoclass:: rex.core.OnField
.. autoclass:: rex.core.Record
   :special-members: __clone__
.. autoclass:: rex.core.RecordField
.. autoclass:: rex.core.Location
.. automethod:: rex.core.set_location
.. automethod:: rex.core.locate
.. autoclass:: rex.core.ValidatingLoader
   :special-members: __call__, __iter__


