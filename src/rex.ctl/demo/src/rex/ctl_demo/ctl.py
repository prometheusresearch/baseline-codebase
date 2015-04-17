
from .user import Users
from rex.ctl import Task, RexTask, Global, env, argument, option, log
from rex.db import get_db
import sys
import os

class HelloTask(Task):
    """greet someone

    Run `rex hello` to greet the current user.  Alternatively,
    run `rex hello <name>` to greet the specified user.
    """

    name = 'hello'

    class arguments:
        name = argument(default=None)

    def __call__(self):
        name = self.name or os.environ.get('USER', 'nobody')
        print "Hello, %s!" % name.capitalize()

class WriteHelloTask(Task):

    name = 'write-hello'

    class arguments:
        name = argument(default=None)

    class options:
        output = option('o', default=None)

    def __call__(self):
        name = self.name or os.environ.get('USER', 'nobody')
        stream = (open(self.output, 'w')
                  if self.output not in [None, '-'] else sys.stdout)
        stream.write("Hello, %s!\n" % name.capitalize())

class DefaultHelloNameGlobal(Global):
    """the name to use for greetings (if not set: login name)"""

    name = 'default-hello-name'
    default = os.environ.get('USER', 'nobody')

class HelloWithConfigurationTask(Task):

    name = 'global-hello'

    class arguments:
        name = argument(default=None)

    def __call__(self):
        name = self.name or env.default_hello_name
        print "Hello, %s!" % name.capitalize()

class InitTask(RexTask):
    """initialize the database"""

    name = 'demo-init'

    def __call__(self):
        self.do('deploy')
        self.do('demo-user-add', code='alice@rexdb.com', name="Alice Amter")
        self.do('demo-user-add', code='bob@rexdb.com', name="Bob Barker")

class CronTask(RexTask):
    """run an ETL job"""

    name = 'demo-cron'

    def __call__(self):
        self.do('query',
                input=[
                    'rex.ctl_demo:/etl/disable-bots.htsql',
                    'rex.ctl_demo:/etl/delete-spammers.htsql'])

class UserListTask(RexTask):
    """list all users"""

    name = 'demo-user-list'

    def __call__(self):
        with self.make():
            for user in Users():
                if user.enabled:
                    log("{} (`{}`)", user.name, user.code)
                else:
                    log("{} ({}) [disabled]", user.name, user.code)

class UserAddTask(RexTask):
    """add a new user"""

    name = 'demo-user-add'

    class arguments:
        code = argument()
        name = argument()

    class options:
        disabled = option(hint="disable the new user")

    def __call__(self):
        with self.make():
            users = Users()
            users.add(self.code, self.name, not self.disabled)
            log("Added user: `{}`", self.code)

class UserEnableTask(RexTask):
    """enable a user"""

    name = 'demo-user-enable'

    class arguments:
        code = argument()

    def __call__(self):
        with self.make():
            users = Users()
            if users.enable(self.code):
                log("Enabled user: `{}`", self.code)

class UserDisableTask(RexTask):
    """disable a user"""

    name = 'demo-user-disable'

    class arguments:
        code = argument()

    def __call__(self):
        with self.make():
            users = Users()
            if users.enable(self.code, False):
                log("Disabled user: `{}`", self.code)

