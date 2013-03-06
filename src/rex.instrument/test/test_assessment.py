
import os
from testbase import TestCase

from rex.instrument import InstrumentRegistry, Instrument, AssessmentStorage, \
                           Assessment, AssessmentStorageError, IN_PROGRESS, \
                           COMPLETED
import simplejson


class TestAssessmentStorage(TestCase):

    def setUp(self):
        super(TestAssessmentStorage, self).setUp()
        AssessmentStorage.create(self.data_dir)
        instrument_dir = os.path.normpath(os.path.join(self.data_dir, '../instruments'))
        instruments = InstrumentRegistry(instrument_dir)
        self.storage = AssessmentStorage(instruments, self.data_dir)

    def test_basic(self):
        json = lambda x: simplejson.dumps(x, sort_keys=True, indent=2)
        empty_data = json(Assessment.empty_data())
        first = self.storage.create_assessment('first')
        self.assertEqual(first.id, 'first_00002_000001')
        self.assertEqual(first.instrument.id, 'first')
        self.assertEqual(first.json, empty_data)
        self.assertEqual(first.status, IN_PROGRESS)
        get = self.storage.get_assessment(first.id)
        self.assertEqual(get.id, first.id)
        self.assertEqual(get.instrument.id, first.instrument.id)
        self.assertEqual(get.json, first.json)
        self.assertEqual(get.status, first.status)
        with self.assertRaises(AssessmentStorageError):
            self.storage.update_assessment(get.id, {'key': 'value'})
        data = Assessment.empty_data()
        data['answers']['first_enum'] = 'a'
        self.storage.update_assessment(get.id, data)
        get = self.storage.get_assessment(get.id)
        self.assertEqual(get.json, json(data))

    def test_create_several(self):
        f1 = self.storage.create_assessment('first')
        f2 = self.storage.create_assessment('first')
        f3 = self.storage.create_assessment('first')
        self.assertNotEqual(f1.id, f2.id)
        self.assertNotEqual(f2.id, f3.id)
        self.assertNotEqual(f1.id, f2.id)

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

    def test_validation(self):
        instrument = self.storage.instruments.get_instrument('first')
        assessment = self.storage.create_assessment(instrument)
        def right(key, value):
            data = Assessment.empty_data()
            data['answers'][key] = value
            self.storage.update_assessment(assessment.id, data)
        def wrong(key, value):
            prev = self.storage.get_assessment(assessment.id)
            with self.assertRaises(AssessmentStorageError):
                right(key, value)
            post = self.storage.get_assessment(assessment.id)
            self.assertEqual(prev.json, post.json)
        wrong('anykey', [])
        # enum
        right('first_enum', 'a')
        wrong('first_enum', 'd')
        right('first_enum', None)
        # set
        wrong('first_set', None)
        wrong('first_set', ['a', 'b'])
        right('first_set_a', True)
        right('first_set_b', False)
        wrong('first_set_b', None)
        # integer
        wrong('first_integer', '25')
        wrong('first_integer', 25.5)
        right('first_integer', 25)
        right('first_integer', None)
        # float, all fun types should be here as well (weight, time_month etc.)
        wrong('first_float', '25')
        right('first_float', 25)
        right('first_float', 25.5)
        right('first_float', None)
        # string
        wrong('first_string', 25)
        wrong('first_string', False)
        right('first_string', '25')
        right('first_string', None)
        # text
        wrong('first_text', 25)
        wrong('first_text', False)
        right('first_text', '25')
        right('first_text', None)
        # date
        wrong('first_date', 25)
        wrong('first_date', False)
        wrong('first_date', 'string')
        wrong('first_date', '2000-40-40')
        right('first_date', '2000-01-29')
        right('first_date', None)

