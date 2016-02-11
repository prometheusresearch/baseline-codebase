Simple Custom Action
--------------------

This example demostrates basic context-independent custom action. It
includes:

- describing/passing parameters (including URLs and rich text)
- running server-side code within the action's request itself using
  **@computed_field**
- using AJAX within one action

.. literalinclude:: ../../src/rex/action_demo/trivial.py
   :language: python
   :caption: src/rex/action_demo/trivial.py
   :name: python
   :linenos:


.. literalinclude:: ../../static/js/lib/Trivial.js
   :language: javascript
   :caption: static/js/lib/Trivial.js
   :name: javascript
   :linenos:


.. literalinclude:: ../../static/urlmap/trivial.yaml
   :language: yaml
   :caption: static/urlmap/trivial.yaml
   :name: yaml
   :linenos:
