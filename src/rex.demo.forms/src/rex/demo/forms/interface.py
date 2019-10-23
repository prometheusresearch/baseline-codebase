#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.db import get_db
from rex.forms.interface import Form, DraftForm, PresentationAdaptor

from rex.demo.instrument import DemoChannel, DemoInstrumentVersion, \
    DemoDraftInstrumentVersion


__all__ = (
    'DemoForm',
    'OtherDemoForm',
    'DemoDraftForm',
    'DemoPresentationAdaptor',
)


# pylint: disable=abstract-method


def safe_uid(clazz, value):
    if isinstance(value, clazz):
        return value.uid
    else:
        return value


class DemoForm(Form):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        database = get_db()
        with database:
            data = database.produce('/form?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoChannel.get_by_uid(data[0].channel),
            DemoInstrumentVersion.get_by_uid(data[0].instrumentversion),
            data[0].configuration,
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        database = get_db()
        with database:
            params = {
                'channel': safe_uid(
                    DemoChannel,
                    search_criteria.get('channel'),
                ),
                'instrument_version': safe_uid(
                    DemoInstrumentVersion,
                    search_criteria.get('instrument_version'),
                ),
            }
            data = database.produce(
                '/form.sort(uid)'
                '.guard($instrument_version,'
                'filter(instrumentversion=$instrument_version))'
                '.guard($channel, filter(channel=$channel))',
                **params
            )
        return [
            cls(
                d.uid,
                DemoChannel.get_by_uid(d.channel),
                DemoInstrumentVersion.get_by_uid(d.instrumentversion),
                d.configuration,
            )
            for d in data
        ]

    @classmethod
    def create(
            cls,
            channel,
            instrument_version,
            configuration,
            implementation_context=None):
        return cls(
            'fake_form_1',
            channel,
            instrument_version,
            configuration,
        )

    def save(self, implementation_context=None):
        print('### SAVED FORM ' + self.uid)


class OtherDemoForm(DemoForm):
    pass


class DemoDraftForm(DraftForm):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        database = get_db()
        with database:
            data = database.produce('/draftform?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoChannel.get_by_uid(data[0].channel),
            DemoDraftInstrumentVersion.get_by_uid(
                data[0].draftinstrumentversion,
            ),
            data[0].configuration,
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        database = get_db()
        with database:
            params = {
                'draftinstrumentversion': safe_uid(
                    DemoDraftInstrumentVersion,
                    search_criteria.get('draft_instrument_version'),
                ),
            }
            data = database.produce(
                '/draftform.sort(uid)'
                '.guard($draftinstrumentversion,'
                'filter(draftinstrumentversion=$draftinstrumentversion))',
                **params
            )
        return [
            cls(
                d.uid,
                DemoChannel.get_by_uid(d.channel),
                DemoDraftInstrumentVersion.get_by_uid(
                    d.draftinstrumentversion,
                ),
                d.configuration,
            )
            for d in data
        ]

    @classmethod
    def create(
            cls,
            channel,
            draft_instrument_version,
            configuration=None,
            implementation_context=None):
        return cls(
            'fake_draftform_1',
            channel,
            draft_instrument_version,
            configuration,
        )

    def save(self, implementation_context=None):
        print('### SAVED DRAFTFORM ' + self.uid)

    def delete(self):
        print('### DELETED DRAFTFORM ' + self.uid)


class DemoPresentationAdaptor(PresentationAdaptor):
    name = 'demo'

    @classmethod
    def adapt(cls, instrument, configuration):
        configuration['title']['en'] = 'AN ADAPTED TITLE'
        return configuration

