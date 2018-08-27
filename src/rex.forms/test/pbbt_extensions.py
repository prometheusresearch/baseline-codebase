import codecs
import glob
import json
import os.path

from pbbt import Test, Field, MatchCase, listof


__all__ = (
    'FormValidatorCase',
)


@Test
class FormValidatorCase(MatchCase):
    class Input(object):
        forms = Field(str)

    class Output(object):
        forms = Field(str)
        validations = Field(listof(dict))

    def run(self):
        # this import needs to be here instead of at the top of the module
        # because if it runs upon load, it seems to confuse converage.py
        from rex.forms import Form, ValidationError

        instrument_cache = {}

        results = []
        for filename in sorted(glob.glob(self.input.forms)):
            self.ui.literal('Validating %s...' % filename)

            data = codecs.open(filename, 'r', encoding='utf-8').read()
            try:
                data_json = json.loads(data)
            except ValueError:
                instrument = None
            else:
                if isinstance(data_json, dict):
                    iid = data_json.get('instrument', {}).get('id', '')
                    iver = data_json.get('instrument', {}).get('version', '')
                    instrument_name = '%s-%s.json' % (iid[4:], iver)
                    if instrument_name not in instrument_cache:
                        path = os.path.join(
                            os.path.dirname(filename),
                            'instruments',
                            instrument_name,
                        )
                        if os.path.exists(path):
                            instrument_cache[instrument_name] = codecs.open(
                                path,
                                'r',
                                encoding='utf-8',
                            ).read()
                    instrument = instrument_cache.get(instrument_name)

            try:
                Form.validate_configuration(data, instrument)
            except ValidationError as exc:
                results.append({
                    filename: u'%s: %s' % (
                        exc.__class__.__name__,
                        exc,
                    ),
                })
            else:
                results.append({
                    filename: 'VALIDATED',
                })

        return self.Output(
            forms=self.input.forms,
            validations=results,
        )

    def render(self, output):
        results = []
        for validation in output.validations:
            filename, output = validation.items()[0]
            results.append('%s --> %s' % (
                filename,
                output,
            ))
        return '\n'.join(results)

