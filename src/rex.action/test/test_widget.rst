Test rex.action.widget
======================

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> from rex.core import Rex
  >>> from rex.action import Action
  >>> from rex.action.widget import ActionWizard

  >>> app = Rex('-', 'rex.action_demo', attach_dir=attach_dir)
  >>> app.on()

  >>> wizard = ActionWizard(action=Action.parse("""
  ... type: pick
  ... entity: individual
  ... """))

  >>> wizard.title
  undefined

  >>> wizard = ActionWizard(action=Action.parse("""
  ... type: pick
  ... entity: individual
  ... title: Title
  ... """))

  >>> wizard.title
  'Title'

  >>> app.off()
