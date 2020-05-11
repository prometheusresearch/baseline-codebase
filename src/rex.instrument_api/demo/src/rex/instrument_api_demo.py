#
# Copyright (c) 2015, Prometheus Research, LLC
#


from datetime import datetime

from rex.core import IntVal
from rex.demo.instrument import DemoAssessment, DemoInstrument, \
    DemoInstrumentVersion, DemoCalculationSet, DemoSubject


__all__ = (
    'ApiDemoSubject',
    'ApiDemoAssessment',
    'ApiDemoInstrument',
    'ApiDemoInstrumentVersion',
    'ApiDemoCalculationSet',
)


class ApiDemoSubject(DemoSubject):
    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'some_extra_parameter': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return DemoAssessment.get_implementation_context(action)

    @classmethod
    def create(cls, mobile_tn=None, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### SUBJECT CREATE CONTEXT: %r' % context)

        return DemoSubject.create(
            mobile_tn=mobile_tn,
            implementation_context=context,
        )


class ApiDemoAssessment(DemoAssessment):
    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'some_extra_parameter': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return DemoAssessment.get_implementation_context(action)

    @classmethod
    def create(cls, subject, instrument_version, data=None, evaluation_date=None, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### ASSESSMENT CREATE CONTEXT: %r' % context)

        return DemoAssessment.create(
            subject,
            instrument_version,
            data=data,
            evaluation_date=evaluation_date,
            implementation_context=context,
        )


class ApiDemoInstrument(DemoInstrument):
    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'param1': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return DemoInstrument.get_implementation_context(action)

    @classmethod
    def create(cls, uid, title, status=None, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### INSTRUMENT CREATE CONTEXT: %r' % context)

        return DemoInstrument.create(
            uid,
            title,
            status=status,
            implementation_context=context,
        )


class ApiDemoInstrumentVersion(DemoInstrumentVersion):
    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'param2': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return DemoInstrumentVersion.get_implementation_context(action)

    @classmethod
    def create(cls, instrument, definition, published_by, version=None, date_published=None, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### INSTRUMENTVERSION CREATE CONTEXT: %r' % context)

        return cls(
            'fake_instrument_version_1',
            instrument,
            definition,
            version,
            published_by,
            date_published or datetime(2014, 5, 22),
        )


class ApiDemoCalculationSet(DemoCalculationSet):
    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'param3': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return DemoCalculationSet.get_implementation_context(action)

    @classmethod
    def create(cls, instrument_version, definition, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### CALCULATIONSET CREATE CONTEXT: %r' % context)

        return cls(
            'fake_calculationset_1',
            instrument_version,
            definition,
        )

