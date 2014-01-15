
from setuptools import setup, find_packages
from distutils.core import Command
import os
import textwrap

class demo(Command):

    description = "show how to send an email"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        from rex.core import Rex
        from rex.sendmail import sendmail
        demo = Rex('rex.sendmail_demo', sendmail='-')
        with demo:
            sendmail(textwrap.dedent("""\
                    From: Alice Anderson <alice@example.net>
                    To: Bob Brown <bob@example.net>
                    Cc: Clothilde Coleman <clothilde@example.net>
                    Bcc: Daniel Delacruz <daniel@nsa.gov>
                    Subject: Hi!

                    Hi Bob and Clothilde!"""))

setup(
    name='rex.sendmail_demo',
    version="1.0.0",
    description="Demo package for testing rex.sendmail",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.sendmail',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
)

