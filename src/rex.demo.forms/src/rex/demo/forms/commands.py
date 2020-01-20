#
# Copyright (c) 2016, Prometheus Research, LLC
#


import os

from datetime import datetime
from imp import load_source

from webob import Response
from webob.exc import HTTPNotFound

from rex.core import StrVal, MapVal, AnyVal
from rex.instrument import Instrument, InstrumentVersion, Assessment, \
    Subject, CalculationSet, InstrumentError, \
    ValidationError as InstrumentValidationError
from rex.forms import PresentationAdaptor, Form, \
    ValidationError as FormValidationError
from rex.web import Command, Parameter, render_to_response


__all__ = (
    'MenuCommand',
    'DemoCommand',
    'CalculationCommand',
    'ReconCommand',
)


# pylint: disable=abstract-method


def load_config_file(directory, base_name):
    file_path = os.path.join(directory, base_name)
    if os.path.exists(file_path + '.json'):
        file_path += '.json'
    elif os.path.exists(file_path + '.yaml'):
        file_path += '.yaml'
    else:
        return None

    with open(file_path, 'r') as config_file:
        return AnyVal().parse(config_file.read())


def get_config(path):
    cfg = {}

    cfg['instrument'] = load_config_file(path, 'instrument')
    cfg['form'] = load_config_file(path, 'form')
    if not cfg['instrument'] or not cfg['form']:
        return None

    if 'title' in cfg['form']:
        cfg['title'] = cfg['form']['title'][
            cfg['form']['defaultLocalization']
        ]
    else:
        cfg['title'] = cfg['instrument']['title']

    cfg['validation_errors'] = None
    try:
        InstrumentVersion.validate_definition(cfg['instrument'])
        Form.validate_configuration(
            cfg['form'],
            instrument_definition=cfg['instrument'],
        )
    except (InstrumentValidationError, FormValidationError) as exc:
        cfg['validation_errors'] = str(exc)
    else:
        cfg['form'] = PresentationAdaptor.adapt_form(
            'demoapp',
            cfg['instrument'],
            cfg['form'],
        )

    cfg['parameters'] = load_config_file(path, 'parameters') or {}

    return cfg


def get_demos(directory, demo_id=None):
    demos = {}

    for path in os.listdir(directory):
        if demo_id and path != demo_id:
            continue

        full_path = os.path.join(directory, path)
        if not os.path.isdir(full_path):
            continue

        demo = get_config(full_path)
        if demo is None:
            continue
        demo['id'] = path

        demo['calculationset'] = load_config_file(full_path, 'calculationset')
        calc_mod_path = os.path.join(full_path, 'calculationset.py')
        demo['calculation_module'] = calc_mod_path \
            if os.path.exists(calc_mod_path) else None

        if not demo['validation_errors'] and demo['calculationset']:
            try:
                CalculationSet.validate_definition(
                    demo['calculationset'],
                    instrument_definition=demo['instrument'],
                )
            except InstrumentValidationError as exc:
                demo['validation_errors'] = str(exc)

        demo['assessment'] = load_config_file(full_path, 'assessment')
        if not demo['validation_errors'] and demo['assessment']:
            try:
                Assessment.validate_data(
                    demo['assessment'],
                    instrument_definition=demo['instrument'],
                )
            except InstrumentValidationError as exc:
                demo['validation_errors'] = str(exc)

        demos[demo['id']] = demo

    return demos


def get_recons(directory, recon_id=None):
    recons = {}

    for path in os.listdir(directory):
        if recon_id and path != recon_id:
            continue

        full_path = os.path.join(directory, path)
        if not os.path.isdir(full_path):
            continue

        recon = get_config(full_path)
        if recon is None:
            continue
        recon['id'] = path

        recon['discrepancies'] = load_config_file(full_path, 'discrepancies')
        recon['entries'] = load_config_file(full_path, 'entries')
        if not recon['discrepancies'] or not recon['entries']:
            continue

        recons[recon['id']] = recon

    return recons


class BaseCommand(Command):
    access = 'anybody'


class MenuCommand(BaseCommand):
    path = '/'

    def render(self, request):
        return render_to_response(
            'rex.demo.forms:/templates/menu.html',
            request,
            demos=get_demos(self.package().abspath('examples/forms')),
            recons=get_recons(
                self.package().abspath('examples/reconciliations'),
            ),
        )


class DemoCommand(BaseCommand):
    path = '/demo/{demo_id}'
    parameters = [
        Parameter('demo_id', StrVal()),
    ]

    def render(self, request, demo_id):
        # pylint: disable=arguments-differ

        demos = get_demos(self.package().abspath('examples/forms'), demo_id)
        if not demos:
            raise HTTPNotFound()

        return render_to_response(
            'rex.demo.forms:/templates/demo.html',
            request,
            demos=get_demos(self.package().abspath('examples/forms')),
            recons=get_recons(
                self.package().abspath('examples/reconciliations'),
            ),
            demo=demos[demo_id],
        )


class CalculationCommand(BaseCommand):
    path = '/demo/{demo_id}/calculate'
    parameters = [
        Parameter('demo_id', StrVal()),
        Parameter('data', MapVal()),
    ]

    def render(self, request, demo_id, data):
        # pylint: disable=arguments-differ,unused-argument

        demos = get_demos(self.package().abspath('examples/forms'), demo_id)
        if not demos:
            raise HTTPNotFound()
        demo = demos[demo_id]

        if not demo['calculationset']:
            return Response(json={'results': {}})

        instrument = Instrument.get_implementation()(
            'fake_inst',
            demo['id'],
            demo['title'],
        )
        instrument_version = InstrumentVersion.get_implementation()(
            'fake_iv',
            instrument,
            demo['instrument'],
            1,
            'demo',
            datetime.now(),
        )
        calculationset = CalculationSet.get_implementation()(
            'fake_cs',
            instrument_version,
            demo['calculationset'],
        )
        subject = Subject.get_implementation()(
            'fake_subject',
        )
        assessment = Assessment.get_implementation()(
            'fake_assessment',
            subject,
            instrument_version,
            data,
            evaluation_date=datetime.now().date(),
            status=Assessment.get_implementation().STATUS_COMPLETE,
        )

        if demo['calculation_module']:
            module = load_source(demo['id'], demo['calculation_module'])
            globals()[demo['id']] = module
        try:
            results = calculationset.execute(assessment)
        except InstrumentError as exc:
            return Response(json={
                'results': {
                    'ERR': str(exc),
                },
            })
        finally:
            if demo['calculation_module']:
                del globals()[demo['id']]

        return Response(json={'results': results})


class ReconCommand(BaseCommand):
    path = '/recon/{recon_id}'
    parameters = [
        Parameter('recon_id', StrVal()),
    ]

    def render(self, request, recon_id):
        # pylint: disable=arguments-differ

        recons = get_recons(
            self.package().abspath('examples/reconciliations'),
            recon_id,
        )
        if not recons:
            raise HTTPNotFound()

        return render_to_response(
            'rex.demo.forms:/templates/recon.html',
            request,
            demos=get_demos(self.package().abspath('examples/forms')),
            recons=get_recons(
                self.package().abspath('examples/reconciliations'),
            ),
            recon=recons[recon_id],
        )

