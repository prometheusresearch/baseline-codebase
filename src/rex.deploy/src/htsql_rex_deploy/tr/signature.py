#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.tr.signature import (
        Signature, Slot, NullarySig, UnarySig, BinarySig)
from htsql.core.tr.fn.signature import ConcatenateSig


class NullableConcatenateSig(ConcatenateSig):
    pass


class EscapeIdentitySig(UnarySig):
    pass


class REMatchesSig(BinarySig):
    pass


class FTMatchesSig(BinarySig):
    pass


class FTQueryMatchesSig(BinarySig):
    pass


class FTHeadlineSig(BinarySig):
    pass


class FTQueryHeadlineSig(BinarySig):
    pass


class FTRankSig(BinarySig):
    pass


class FTQueryRankSig(BinarySig):
    pass



class JoinSig(Signature):

    slots = [
            Slot('op'),
            Slot('delimiter'),
    ]


class AbsSig(UnarySig):
    pass


class SignSig(UnarySig):
    pass


class CeilSig(UnarySig):
    pass


class FloorSig(UnarySig):
    pass


class DivSig(BinarySig):
    pass


class ModSig(BinarySig):
    pass


class ExpSig(UnarySig):
    pass


class PowSig(BinarySig):
    pass


class LnSig(UnarySig):
    pass


class Log10Sig(UnarySig):
    pass


class LogSig(BinarySig):
    pass


class PiSig(NullarySig):
    pass


class ACosSig(UnarySig):
    pass


class ASinSig(UnarySig):
    pass


class ATanSig(UnarySig):
    pass


class ATan2Sig(BinarySig):
    pass


class CosSig(UnarySig):
    pass


class CotSig(UnarySig):
    pass


class SinSig(UnarySig):
    pass


class TanSig(UnarySig):
    pass


class RandomSig(NullarySig):
    pass


class ToJSONSig(UnarySig):
    pass


class JSONGetSig(BinarySig):
    pass


class JSONGetJSONSig(BinarySig):
    pass


class MedianSig(UnarySig):
    pass


class WidthBucketSig(Signature):

    slots = [
            Slot('op'),
            Slot('b1'),
            Slot('b2'),
            Slot('count'),
    ]
