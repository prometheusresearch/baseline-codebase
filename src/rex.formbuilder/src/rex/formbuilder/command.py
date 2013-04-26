import simplejson

from rexrunner.response import BadRequestError
from rexrunner.registry import register_command

#from rex.forms.command import RoadsCommand
from rexrunner.command import Command
from webob import Response

class FormBuilderBaseCommand(Command):

    def __init__(self, parent):
        super(FormBuilderBaseCommand, self).__init__(parent)
        self.handler = self.parent.app.handler_by_name['rex.formbuilder']

@register_command
class FormList(FormBuilderBaseCommand):

    name = '/instrument_list'

    def render(self, req):
        # self.set_handler()
        res = self.handler.get_list_of_forms()
        return Response(body=simplejson.dumps(res))


@register_command
class LoadForm(FormBuilderBaseCommand):

    name = '/load_instrument'

    def render(self, req):
        # self.set_handler()
        code = req.GET.get('code')
        if not code:
            return Response(status='401', body='Code not provided')
        form, _ = self.handler.get_latest_instrument(code)
        if not form:
            return Response(body='Form not found')
        return Response(body=form)


@register_command
class AddForm(FormBuilderBaseCommand):

    name = '/add_instrument'

    def render(self, req):
        # self.set_handler()
        post = req.POST.get('data')
        form_name = req.POST.get('instrument')
        if not post:
            return Response(status='401', body='No POST data provided')
        if not form_name:
            return Response(status='401', body='Form code not provided')
        self.user = req.environ.get('REMOTE_USER')
        post = simplejson.loads(post)
        new = Form(post, form_name)
        old, version = self.handler.get_latest_form(new.code)
        if not old:
            #such form doesn't exist - adding it
            self.handler.store_form(new.code, post, '1', req)
            return Response(body='Saved!')
        if not self.handler.check_packets(new.code, version):
            #no packets exist
            self.handler.store_form(new.code, post, version, req)
            return Response(body='Saved!')
        old = Form(simplejson.loads(old), form_name)
        for que in new.questions:
            new_question = new.questions[que]
            old_question = old.questions.get(que)
            if not new_question.isEqual(old_question):
                #new version is needed
                version = str(int(version) + 1)
                self.handler.store_form(new.code, post,
                                             version, req)
                return Response(body='Saved!')
        #only minor changes - replacing form
        self.handler.store_form(new.code, post, version, req)
        return Response(body='Saved!')


@register_command
class RoadsBuilder(FormBuilderBaseCommand):

    name = '/builder'

    def render(self, req):
        # self.set_handler()

        code = req.GET.get('instrument')
        if not code:
            return Response(status='401', body='Code not provided')
        (form, _) = self.handler.get_latest_instrument(code)

        # if not form:
        #    return Response(body='Form not found')

        args = {
            'instrument': code,
            'req': req,
            'manual_edit_conditions': self.app.config.manual_edit_conditions
        }

        return self.render_to_response('/roadsbuilder.html', **args)
