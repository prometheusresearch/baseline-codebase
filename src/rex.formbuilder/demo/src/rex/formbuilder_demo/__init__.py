#
# Copyright (c) 2014, Prometheus Research, LLC
#


import re


COOKIE_REGEXP = re.compile(r"^Set-Cookie\: .*$\n{0,1}", re.MULTILINE)


def strip_cookies(response):
    return COOKIE_REGEXP.sub(r"", str(response))

