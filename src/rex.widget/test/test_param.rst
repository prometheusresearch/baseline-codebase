Param
=====

::

  >>> from rex.widget import ParamVal, encode

  >>> parse = ParamVal().parse

  >>> parse("param")
  Param(value='param', context_ref=None, required=False)

  >>> parse("$param")
  Param(value=None, context_ref=['param'], required=False)

  >>> parse("""
  ... value: param
  ... """)
  Param(value='param', context_ref=None, required=False)

  >>> parse("""
  ... value: $param
  ... """)
  Param(value=None, context_ref=['param'], required=False)

  >>> parse("""
  ... value: param
  ... required: true
  ... """)
  Param(value='param', context_ref=None, required=True)

  >>> parse("""
  ... value: $param
  ... required: true
  ... """)
  Param(value=None, context_ref=['param'], required=True)
