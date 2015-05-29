************
  Cookbook
************

This page contains various how-to guides on the most common topics. It tries to
refer to relevant parts of the documentation to solve practical tasks arising
while using Rex Widget framework.

Passing params to a widget from another page
--------------------------------------------

If widget uses state cells with params::

  getInitialState() {
    return {
      name: RexWidget.cell(null, {param: 'name'})
    }
  }

Then state cell can be initialized from ``?name=...`` URL parameter. That means
that by generating a link with ``?name=...`` parameter you can set the value of
``this.state.name.value`` to this parameter value. You can use ``Link`` widget
for that::

  <RexWidget.Link href="/page" params={{name: 'somename'}} />

Now component with the state cell above will have ``'somename'`` as a value of
``this.state.name.value``.

Pass params to a widget in an iframe
------------------------------------

See the guide above. You need to generate ``src`` attribute of an iframe with
parameters corresponding to state cells in widgets on the target page.


Adding a slot to an existing widget
-----------------------------------

You add a slot to a widget when you want to add something configurable
to the widget.

A change is required in four places.  We'll proceed from the bottom up.

1. In the python file which implements the widget server-side
   add a field for your slot.

2. In the javascript file which implements the widget client-side
   add code to process the slot's data.

3. In the yaml file which declares the widget's slots 
   add a declaration for your slot.

4. In the yaml file which instantiates the widget
   add your slot and its data.
  
First, find the python implementation of the widget and 
add a field to the widget for your slot.  
This .py file will reside somewhere in **src/**

.. note::

    You can use a pipeline with **find**, **xargs**, and **grep** 
    to find things.  For example::

        find src -name '*.py' | xargs grep 'MyWidget'

Choose a lowercase name for your slot::

    my_slot = Field(
            ...Val(...),
            ...,
            doc="""another doc string for my slot""")

You must choose an appropriate validator from `rex.core`_.
For example if your slot was to hold a list of form fields, 
your validator would be::

    SeqVal(FormFieldVal()),    

See `rex.core`_ for a description of the Field class
and the available validators.

Next, find the javascript implementation of the widget 
and add the code that accesses the slot data.
This .js file will reside somewhere in **static/js/lib/**

You will add code to the widget's render() method which
processes the slot's data.

Remember that React converts all variable names to CamelCase.
The code accesses my_slot as a (CamelCased) property of this.props::

    var mySlotData = this.props.mySlot;

Next, find the high level yaml file which declares the widget's slots.
(By convention) this will likely be some file in static/page.

To declare your slot, you need a name, a default value, 
and a documentation string.
Your slot name must be the same name you used for the python field.
Be sure the value of name: is also the same.

Unsure why we need to specify two doc strings (yaml and python) 
but for sanity sake they ought to be the same (or similar).

For example to create **my_slot**::

    my_slot: !slot
      name: my_slot
      default: this is the default value for my slot
      doc: this string describes my slot

Finally, in your yaml file which invokes the widget 
you supply the data for the slot.  
The data will be validated and must match the validator you declared
in the python field for the slot::

    my_slot: data for my slot (not necessarily a string as shown here)
     
     
.. _rex.core: https://bitbucket.org/rexdb/rex.core


