Test rex.widget.port_support
============================

::

  >>> from rex.core import Rex
  >>> from rex.widget import PortSupport

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

::

  >>> class MyClass(PortSupport):
  ... 
  ...   def __init__(self):
  ...       super(MyClass, self).__init__()
  ... 
  ...   def get_port(self):
  ...       return self.create_port('individual')

  >>> with PortSupport.parameters({'a': 'b'}):
  ...   instance = MyClass()

  >>> instance.get_port()
  Port('''
  - parameter: a
    default: b
  - entity: individual
    select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

::

  >>> rex.off()

