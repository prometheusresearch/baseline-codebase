#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.tr.signature import Signature, Slot, BinarySig


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


