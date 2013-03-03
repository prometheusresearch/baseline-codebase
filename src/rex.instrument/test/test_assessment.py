
import os
from testbase import TestCase

from rex.instrument import InstrumentRegistry, Instrument, AssessmentStorage, \
                           Assessment, AssessmentStorageError, IN_PROGRESS, \
                           COMPLETED


class TestAssessmentStorage(TestCase):

    def setUp(self):
        super(TestAssessmentStorage, self).setUp()
        AssessmentStorage.create(self.data_dir)
        instrument_dir = os.path.normpath(os.path.join(self.data_dir, '../instruments'))
        instruments = InstrumentRegistry(instrument_dir)
        self.storage = AssessmentStorage(instruments, self.data_dir)

    def test_basic(self):
        first = self.storage.create_assessment('first')
        self.assertEqual(first.id, 'first_00002_000000')
        self.assertEqual(first.instrument.id, 'first')
        self.assertEqual(first.json, "{}")
        self.assertEqual(first.status, IN_PROGRESS)
        get = self.storage.get_assessment(first.id)
        self.assertEqual(get.id, first.id)
        self.assertEqual(get.instrument.id, first.instrument.id)
        self.assertEqual(get.json, first.json)
        self.assertEqual(get.status, first.status)
        self.storage.update_assessment(get.id, {'key': 'value'})
        get = self.storage.get_assessment(get.id)
        self.assertEqual(get.json, '{\n  "key": "value"\n}')

    def test_complete(self):
        a = self.storage.create_assessment('first')
        self.storage.complete_assessment(a.id)
        a = self.storage.get_assessment(a.id)
        self.assertEqual(a.status, COMPLETED)

    def test_iterators(self):
        all = [None, None, None]
        instrument = self.storage.instruments.get_instrument('first', version=1)
        all[0] = self.storage.create_assessment(instrument)
        all[1] = self.storage.create_assessment('first')
        all[2] = self.storage.create_assessment('second')        
        self.assertEqual(len(list(self.storage.assessments)), 3)
        for i, a in enumerate(self.storage.assessments):
            self.assertEqual(all[i].id, a.id)
        self.assertFalse(self.storage.get_assessment(all[0].id).is_completed)
        self.storage.complete_assessment(all[0].id)
        self.assertTrue(self.storage.get_assessment(all[0].id).is_completed)
        self.storage.complete_assessment(all[2].id)
        completed = [a for a in self.storage.completed_assessments]
        self.assertEqual(completed[0].id, all[0].id)
        self.assertEqual(completed[1].id, all[2].id)

