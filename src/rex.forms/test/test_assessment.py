
import os
from testbase import TestCase

from rex.forms.model import FormRegistry, Form, AssessmentStorage, Assessment, \
                            AssessmentStorageError, IN_PROGRESS, COMPLETED


class TestAssessmentStorage(TestCase):

    def setUp(self):
        super(TestAssessmentStorage, self).setUp()
        AssessmentStorage.create(self.data_dir)
        form_dir = os.path.normpath(os.path.join(self.data_dir, '../forms'))
        form_registry = FormRegistry(form_dir)
        self.storage = AssessmentStorage(form_registry, self.data_dir)

    def test_basic(self):
        first = self.storage.create_assessment('first')
        self.assertEqual(first.id, 'first_00002_000000')
        self.assertEqual(first.form.id, 'first')
        self.assertEqual(first.json, "{}")
        self.assertEqual(first.status, IN_PROGRESS)
        get = self.storage.get_assessment(first.id)
        self.assertEqual(get.id, first.id)
        self.assertEqual(get.form.id, first.form.id)
        self.assertEqual(get.json, first.json)
        self.assertEqual(get.status, first.status)
        self.storage.update_assessment(get.id, {'key': 'value'})
        get = self.storage.get_assessment(get.id)
        self.assertEqual(get.json, '{\n  "key": "value"\n}')
