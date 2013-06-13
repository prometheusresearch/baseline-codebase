#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import task
from cogs.fs import exe


@task
def DEMO():
    """install the demo package"""
    exe("pip install -q -e ./demo/rex.ctl_demo")


@task
def TEST():
    """run the test suite"""
    exe("pbbt -q")


@task
def TRAIN():
    """train the test suite"""
    exe("pbbt --train")


@task
def DOC():
    """generate documentation"""
    exe("sphinx-build -q -b html ./doc ./build/doc")


