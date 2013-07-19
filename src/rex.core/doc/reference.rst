**************************
  REX.CORE API Reference
**************************

.. contents:: Table of Contents

.. automodule:: rex.core


Application object
==================

.. autoclass:: rex.core.Rex
   :special-members: __call__
.. autofunction:: rex.core.get_rex
.. autoclass:: rex.core.Initialize
   :special-members: __call__


Caching
=======

.. autofunction:: rex.core.cached


Extensions
==========

.. autoclass:: rex.core.Extension


Packages
========

.. autoclass:: rex.core.Package
.. autoclass:: rex.core.ModulePackage
.. autoclass:: rex.core.StaticPackage
.. autoclass:: rex.core.PackageCollection
   :special-members: __iter__, __len__, __getitem__
.. autofunction:: rex.core.get_packages


Settings
========

.. autoclass:: rex.core.Setting
.. autoclass:: rex.core.SettingCollection
.. autofunction:: rex.core.get_settings()


WSGI
====

.. autoclass:: rex.core.WSGI
.. autofunction:: rex.core.get_wsgi


Errors
======

.. autoexception:: rex.core.Error
   :special-members: __call__
.. autoclass:: guard


Validators
==========

.. autoclass:: rex.core.Validate
   :special-members: __call__
.. autoclass:: rex.core.AnyVal
.. autoclass:: rex.core.MaybeVal
.. autoclass:: rex.core.OneOfVal
.. autoclass:: rex.core.StrVal
.. autoclass:: rex.core.ChoiceVal
.. autoclass:: rex.core.BoolVal
.. autoclass:: rex.core.IntVal
.. autoclass:: rex.core.UIntVal
.. autoclass:: rex.core.PIntVal
.. autoclass:: rex.core.SeqVal
.. autoclass:: rex.core.MapVal
.. autoclass:: rex.core.OMapVal
.. autoclass:: rex.core.RecordVal


