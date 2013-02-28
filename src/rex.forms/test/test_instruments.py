
import os
from testbase import TestCase

from rex.forms.model import InstrumentRegistry, Instrument

class TestInstrumentRegistry(TestCase):

    def setUp(self):
        super(TestInstrumentRegistry, self).setUp()
        instrument_dir = os.path.normpath(os.path.join(self.data_dir, '../instruments'))
        self.instruments = InstrumentRegistry(instrument_dir)

    def testBasic(self):
        instrument = self.instruments.get_instrument('non-existent')
        self.assertIsNone(instrument)
        instrument = self.instruments.get_instrument('non-existent', version=100)
        self.assertIsNone(instrument)
        first_latest = self.instruments.get_instrument('first')
        first_2 = self.instruments.get_instrument('first', version=2)
        self.assertEqual(first_latest.id, first_2.id)
        self.assertEqual(first_latest.version, first_2.version)
        self.assertEqual(first_latest.version, 2)
        self.assertEqual(first_latest.json, first_2.json)
        first_1 = self.instruments.get_instrument('first', version=1)
        self.assertEqual(first_1.id, first_2.id)
        self.assertNotEqual(first_1.version, first_2.version)
        self.assertEqual(first_1.version, 1)
        self.assertNotEqual(first_1.json, first_2.json)
        instrument = self.instruments.get_instrument('first', version=100)
        self.assertIsNone(instrument)

    def test_iterators(self):
        all_instruments = sorted([(f.id, f.version) 
                            for f in self.instruments.all_instruments])
        self.assertItemsEqual(tuple(all_instruments), 
                              (('first', 1), ('first', 2), ('second', 1)))
        latest_instruments = [(f.id, f.version) 
                        for f in self.instruments.latest_instruments]
        self.assertItemsEqual(tuple(latest_instruments), 
                              (('first', 2), ('second', 1)))
