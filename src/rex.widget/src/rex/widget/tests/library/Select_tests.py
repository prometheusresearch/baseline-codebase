"""

    rex.widget.tests.library.Select_tests
    =====================================

    Tests for <Select /> widget.

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.widget.test import ScreenTest


class TestSelectWithStaticOptions(ScreenTest):

    screen_config = """
    !<Select>
    id: select
    options:
    - id: 1
      name: Option 1
    - id: 2
      name: Option 2
    - id: 3
      name: Option 3
    """

    def test(self):
        ui = self.screen.get()

        assert len(ui.data) == 0
        assert len(ui.state) == 1

        assert 'select/value' in ui.state
        assert ui.state['select/value'] == None

    def test_initial_value(self):
        ui = self.screen.get({'select/value': 1})
        assert ui.state['select/value'] == '1'

    def test_update_value(self):
        ui = self.screen.get()
        assert ui.state['select/value'] == None
        ui = ui.update({'select/value': '1'})
        assert ui.state['select/value'] == '1'


class TestSelectWithDynamicOptions(ScreenTest):

    screen_config = """
    !<Select>
    id: select
    data:
      entity: study_options
      data: rex.widget_demo:/__tests__/study_options
    """

    def test(self):
        ui = self.screen.get()

        assert len(ui.state) == 2
        assert 'select/value' in ui.state
        assert 'select/data' in ui.state

        assert len(ui.data) == 1
        assert 'study_options' in ui.data


class TestSelectWithNoEmptyValue(ScreenTest):

    screen_config = """
    !<Select>
    id: select
    no_empty_value: true
    options:
    - id: 1
      name: Option 1
    - id: 2
      name: Option 2
    - id: 3
      name: Option 3
    """

    def test(self):
        ui = self.screen.get()
        assert len(ui.state) == 1
        assert 'select/value' in ui.state
        assert ui.state['select/value'] == 1
