
import os
from testbase import TestCase

from rex.forms.model import FormRegistry, Form

class TestFormRegistry(TestCase):

    def setUp(self):
        super(TestFormRegistry, self).setUp()
        form_dir = os.path.normpath(os.path.join(self.data_dir, '../forms'))
        self.form_registry = FormRegistry(form_dir)

    def testBasic(self):
        form = self.form_registry.get_form('non-existent')
        self.assertIsNone(form)
        form = self.form_registry.get_form('non-existent', version=100)
        self.assertIsNone(form)
        first_latest = self.form_registry.get_form('first')
        first_2 = self.form_registry.get_form('first', version=2)
        self.assertEqual(first_latest.id, first_2.id)
        self.assertEqual(first_latest.version, first_2.version)
        self.assertEqual(first_latest.version, 2)
        self.assertEqual(first_latest.json, first_2.json)
        first_1 = self.form_registry.get_form('first', version=1)
        self.assertEqual(first_1.id, first_2.id)
        self.assertNotEqual(first_1.version, first_2.version)
        self.assertEqual(first_1.version, 1)
        self.assertNotEqual(first_1.json, first_2.json)
        form = self.form_registry.get_form('first', version=100)
        self.assertIsNone(form)

    def test_iterators(self):
        all_forms = sorted([(f.id, f.version) 
                            for f in self.form_registry.all_forms])
        self.assertItemsEqual(tuple(all_forms), 
                              (('first', 1), ('first', 2), ('second', 1)))
        latest_forms = [(f.id, f.version) 
                        for f in self.form_registry.latest_forms]
        self.assertItemsEqual(tuple(latest_forms), 
                              (('first', 2), ('second', 1)))
