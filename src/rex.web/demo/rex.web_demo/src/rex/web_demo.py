
from rex.core import get_packages, StrVal
from rex.web import (HandleError, HandleLocation, HandleFile, Command, Parameter,
        render_to_response)
from webob import Response
import sqlite3
import csv
import os


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


class HandleSQL(HandleFile):

    ext = '.sql'
    database = ':memory:'

    def __call__(self, req):
        # Load the query.
        packages = get_packages()
        sql_file = packages.open(self.filename)
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
                % os.path.splitext(os.path.basename(self.filename))[0]
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


