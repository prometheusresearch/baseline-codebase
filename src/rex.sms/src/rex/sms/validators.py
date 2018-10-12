#
# Copyright (c) 2014, Prometheus Research, LLC
#

import re

import phonenumbers

from rex.core import UStrVal, Error


__all__ = (
    'TelephoneNumberVal',
    'ShortCodeVal',
)


RE_BOGUS_TN_CHARACTERS = re.compile(r'[^\W\d_]', re.UNICODE)


class TelephoneNumberVal(UStrVal):
    """
    Accepts strings that resemble telephone numbers and formats them in the
    international E.164 format.
    """

    def __init__(self, default_region=None):
        self.default_region = (default_region or 'US').upper()
        if self.default_region not in phonenumbers.SUPPORTED_REGIONS:
            raise Error(
                'Region "%s" is not supported' % (self.default_region,)
            )
        super(TelephoneNumberVal, self).__init__()

    def __call__(self, data):
        # pylint: disable=super-on-old-class
        data = super(TelephoneNumberVal, self).__call__(data)
        data = data.strip()

        if data.startswith('+'):
            region = None
        else:
            region = self.default_region

        if RE_BOGUS_TN_CHARACTERS.search(data):
            self._fail(data)

        try:
            phone = phonenumbers.parse(data, region)
        except phonenumbers.NumberParseException:
            self._fail(data)
        else:
            if not phonenumbers.is_possible_number(phone):
                self._fail(data)

        return phonenumbers.format_number(
            phone,
            phonenumbers.PhoneNumberFormat.E164,
        )

    def _fail(self, data):
        raise Error('expected a phone number, got \'%s\'' % data)


RE_NONDIGIT = re.compile(r'[^0-9]')


class ShortCodeVal(UStrVal):
    """
    Accepts strings that resemble short code numbers.
    """

    def __init__(self, default_region=None):
        self.default_region = (default_region or 'US').upper()
        if self.default_region not in phonenumbers.SUPPORTED_SHORT_REGIONS:
            raise Error(
                'Region "%s" is not supported' % (self.default_region,)
            )
        super(ShortCodeVal, self).__init__()

    def __call__(self, data):
        value = super(ShortCodeVal, self).__call__(data)
        value = str(RE_NONDIGIT.sub('', data))

        try:
            phone = phonenumbers.parse(data, self.default_region)
        except phonenumbers.NumberParseException:
            raise Error('expected a short code, got \'%s\'' % data)
        else:
            if not phonenumbers.is_valid_short_number_for_region(
                    phone,
                    self.default_region):
                raise Error('expected a short code, got \'%s\'' % data)

        return value

