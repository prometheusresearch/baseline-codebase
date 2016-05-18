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
    Subject, CalculationSet, InstrumentError
from rex.web import Command, Parameter, render_to_response


__all__ = (
    'MenuCommand',
    'DemoCommand',
    'CalculationCommand',
)


# pylint: disable=abstract-method


def get_demos(directory, demo_id=None):
    demos = {}

    for path in os.listdir(directory):
        demo = {
            'id': path,
        }

        if demo_id and path != demo_id:
            continue

        path = os.path.join(directory, path)
        if not os.path.isdir(path):
            continue

        demo['instrument'] = load_config_file(path, 'instrument')
        demo['form'] = load_config_file(path, 'form')
        demo['calculationset'] = load_config_file(path, 'calculationset')

        if 'title' in demo['form']:
            demo['title'] = demo['form']['title'][
                demo['form']['defaultLocalization']
            ]
        else:
            demo['title'] = demo['instrument']['title']

        calc_mod_path = os.path.join(path, 'calculationset.py')
        demo['calculation_module'] = calc_mod_path \
            if os.path.exists(calc_mod_path) else None

        demos[demo['id']] = demo

    return demos


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


class BaseCommand(Command):
    access = 'anybody'


class MenuCommand(BaseCommand):
    path = '/'

    def render(self, request):
        return render_to_response(
            'rex.forms_demo:/templates/menu.html',
            request,
            demos=get_demos(self.package().abspath('examples')),
        )


class DemoCommand(BaseCommand):
    path = '/demo/{demo_id}'
    parameters = [
        Parameter('demo_id', StrVal()),
    ]

    def render(self, request, demo_id):
        # pylint: disable=arguments-differ

        demos = get_demos(self.package().abspath('examples'), demo_id)
        if not demos:
            raise HTTPNotFound()

        return render_to_response(
            'rex.forms_demo:/templates/demo.html',
            request,
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

        demos = get_demos(self.package().abspath('examples'), demo_id)
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
        except IntrumentError as exc:
            return Response(json={
                'results': {
                    'ERR': unicode(exc),
                },
            })
        finally:
            if demo['calculation_module']:
                del globals()[demo['id']]

        return Response(json={'results': results})

