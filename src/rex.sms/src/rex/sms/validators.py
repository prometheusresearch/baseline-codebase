#
# Copyright (c) 2014, Prometheus Research, LLC
#


import phonenumbers

from rex.core import StrVal, Error


__all__ = (
    'TelephoneNumberVal',
)


class TelephoneNumberVal(StrVal):
    """
    Accepts strings that resemble telephone numbers and formats them in the
    international E.164 format.
    """

    def __call__(self, data):
        data = super(TelephoneNumberVal, self).__call__(data)
        data = data.strip()

        if data.startswith('+'):
            region = None
        else:
            region = 'US'

        try:
            phone = phonenumbers.parse(data, region)
        except phonenumbers.NumberParseException:
            raise Error('expected a phone number, got \'%s\'' % data)
        else:
            if not phonenumbers.is_possible_number(phone):
                raise Error('expected a phone number, got \'%s\'' % data)

        return phonenumbers.format_number(
            phone,
            phonenumbers.PhoneNumberFormat.E164,
        )

