**************************
REX.EXPRESSION Usage Guide
**************************

.. contents:: Table of Contents

Overview
========

Rex.expression is a JavaScript library used to parse and evaluate sub-set of 
HTSQL expressions. It is used in client-side projects like REX.ROADS and 
REX.FORMS to evaluate values of show/hide logic.

Usage
=====

First rex.expression should be included in HTML code with this snippet::

    {% import "rex.expression:/macro.html" as expression with context %}
    ...
    <head>
        {{ expression.rexl() }}
    </head>

In JavaScript code rex.expression gives three possibilities. First, it can 
parse rexl expressions::

    var rexlParsed = rexl.parse(rexlString);

Second, it can change values in rexl values, later used in evaluation. It 
is made with following construction::

    var rexlValue = rexl.value(value, type);

Here ``type`` is one of supported rexl types. Either 'String', 'Number',
'Boolean' or 'Untyped'. It is also possible to make rexl values in other way
using value method of rexl.types. So those two snippets will produce same
result::

    var r1 = rexl.value('test', 'String');
    var r2 = rexl.String.value('test');

After rexl expression is parsed and values are changed to rexl format it is
possible to evaluate rexls::

    function callback(name) {
        return rexl.value('Number', 100);
    }
    var s = 'aspect1.link.field1=100'; // s - valid rexl expression
    var ret = rexl.evaluate(s, callback);
    
Here ``callback`` is a function, that is called to get rexl value of each 
unknown name it encounters. So, in this snippet ``callback`` will be called
twice::

    function callback(name) {
        return rexl.value('Number', 100);
    }
    var s = 'aspect1.link.field1=100&aspect1.link.field2=200';
    var ret = rexl.evaluate(s, callback);

Once it'll be called with ``name`` equal to ``aspect1.link.field1`` and
once more with ``name`` ``aspect1.link.field2``.

Features supported
==================

Rexl supports following operations: 

* '+' - adding;
* '-' - substraction;
* '|' - or;
* '&' - and;
* '!' - not;
* '=' or '==' - equals;
* '!=' or '!==' - not equals;
* '>' - greater;
* '<' -  less;
* '>=' - greater or equal;
* '<=' - less or equal;

It also supports a list of functions:

* 'true()';
* 'false()';
* 'null()';
* 'is_true()' - checks if value is true;
* 'is_false()' - checks if value is false;
* 'if(x, y, z)' - if ``x`` is true it returns ``y``. Otherwise, ``z``;
* 'coalesce()' - returns first of arguments that is not null;
* 'count_true()' - returns number of agruments that are ``true()`` in 
  arguments.
