#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.db import get_db
from rex.mobile.interface import *

from rex.instrument_demo import *


__all__ = (
    'DemoInteraction',
    'OtherDemoInteraction',
)


def safe_uid(clazz, value):
    if isinstance(value, clazz):
        return value.uid
    else:
        return value


class DemoInteraction(Interaction):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/interaction?id()=$uid', uid=uid)
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
        db = get_db()
        with db:
            params = {
                'channel': safe_uid(DemoChannel, search_criteria.get('channel')),
                'instrument_version': safe_uid(DemoInstrumentVersion, search_criteria.get('instrument_version')),
            }
            data = db.produce(
                '/interaction.sort(uid).guard($instrument_version, filter(instrumentversion=$instrument_version)).guard($channel, filter(channel=$channel))',
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
    def create(cls, channel, instrument_version, configuration, implementation_context=None):
        return cls(
            'fake_interaction_1',
            channel,
            instrument_version,
            configuration,
        )

    def save(self):
        print '### SAVED INTERACTION ' + self.uid


class OtherDemoInteraction(DemoInteraction):
    pass


