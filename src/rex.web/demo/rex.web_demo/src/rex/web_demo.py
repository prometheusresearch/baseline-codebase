
from rex.core import get_packages, StrVal, PIntVal
from rex.web import (HandleError, HandleLocation, HandleFile, Command, Parameter,
        render_to_response)
from webob import Response
import sqlite3
import csv
import os
import docutils.core


class HandleNotFound(HandleError):

    code = 404
    template = 'rex.web_demo:/templates/404.html'

    def __call__(self, req):
        return render_to_response(self.template, req, status=self.code,
                                  path=req.path)


class HandlePing(HandleLocation):

    path = '/ping'

    def __call__(self, req):
        return Response(content_type='text/plain', body="PONG!")


class HandleRST(HandleFile):

    ext = '.rst'

    def __call__(self, req):
        # Load the file.
        packages = get_packages()
        with packages.open(self.path) as rst_file:
            rst_input = rst_file.read()

        # Render to HTML.
        html_output = docutils.core.publish_string(rst_input,
                                                   writer_name='html')

        # Generate the response.
        return Response(html_output)


class HandleSQL(HandleFile):

    ext = '.sql'
    database = ':memory:'

    def __call__(self, req):
        # Load the query.
        packages = get_packages()
        sql_file = packages.open(self.path)
        sql = sql_file.read()
        sql_file.close()

        # Execute the query.
        conn = sqlite3.connect(self.database)
        cursor = conn.cursor()
        cursor.execute(sql)
        head = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        conn.close()

        # Generate the response.
        response = Response(content_type='text/csv')
        response.content_disposition = "attachment; filename=%s.csv" \
                % os.path.splitext(os.path.basename(self.path))[0]
        writer = csv.writer(response.body_file, lineterminator='\n')
        writer.writerow(head)
        writer.writerows(rows)

        return response


class HelloCmd(Command):

    path = '/hello'
    role = 'anybody'
    parameters = [
        Parameter('name', StrVal('^[A-Za-z]+$'), default='World'),
    ]

    def render(self, req, name):
        return Response("Hello, %s!" % name, content_type='text/plain')


class FactorialCmd(Command):

    path = '/factorial'
    role = 'anybody'
    parameters = [
            Parameter('n', PIntVal()),
    ]

    def render(self, req, n):
        f = 1
        for k in range(1, n+1):
            f *= k
        return Response(json={"n": n, "n!": f})


