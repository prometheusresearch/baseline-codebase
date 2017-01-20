#
# Copyright (c) 2015, Prometheus Research, LLC
#


import gc
import sys
import traceback

from datetime import datetime

from htsql.ctl import HTSQL_CTL
from htsql.ctl.error import ScriptError
from rex.db.ctl import RexShellRoutine
from rex.core import Error, get_packages
from rex.ctl import RexTask, argument, option, log
from rex.ctl.common import pair

from .config import get_all_definitions
from .connections import get_management_db
from .creation import MartCreator
from .mart import Mart
from .permissions import MartAccessPermissions
from .validators import RunListVal


__all__ = (
    'MartCreateTask',
    'MartShellTask',
    'MartPurgeTask',
)


class MartCreateTask(RexTask):
    """
    create Mart database(s)

    The mart-create task will create the specified Mart databases. You specify
    the Marts to create by either using a combination of the --owner and
    --definition options, or by using the --runlist option in combination with
    a RunList file.

    When using the --owner/--definition option combination, this task will
    create a Mart for every unique combination of owners and definitions that
    were specified.
    """

    name = 'mart-create'

    class options(object):  # noqa
        owner = option(
            'o',
            str,
            default=(),
            plural=True,
            hint='The owner to assign to the Mart. This option may be repeated'
            ' to create Marts for multiple owners.',
        )

        definition = option(
            'd',
            str,
            default=(),
            plural=True,
            hint='The ID of the Definition to use when creating the Mart. This'
            ' option may be repeated to create multiple types of Marts.',
        )

        runlist = option(
            'r',
            str,
            default=None,
            hint='The Mart RunList that details the batch creation of multiple'
            ' Mart databases. If this option is specified, the --owner and'
            ' --definition options cannot be used. To reference a runlist'
            ' file that is embedded in a RexDB package, use the notation'
            ' "some.package:/path/to/runlist.yaml"',
        )

        halt_on_failure = option(
            None,
            bool,
            hint='Indicates whether or not the failure to create a single Mart'
            ' will cause the task to immediately stop. If not specified, the'
            ' task will attempt to create all specified Marts, regardless of'
            ' failures.',
        )

        keep_on_failure = option(
            None,
            bool,
            hint='Indicates whether or not the databases of failed Mart'
            ' creations should be kept. If not specified, failed Marts will'
            ' automatically have their databases deleted.',
        )

        leave_incomplete = option(
            None,
            bool,
            hint='Indicates whether or not to leave the status of Marts open.'
            ' If not specified, Marts will automatically be marked as'
            ' "complete", meaning they can be accessed by front-end users.',
        )

        param = option(
            'p',
            pair,
            default=[],
            plural=True,
            value_name='PARAM=VALUE',
            hint='Sets a Mart creation parameter value.',
        )

    def __call__(self):
        with self.make():
            runlist = self.determine_runlist()
            for entry in runlist:
                try:
                    self.execute(entry)
                except Error:
                    self.execution_error(
                        'Mart creation for %r failed:\n%s' % (
                            entry,
                            traceback.format_exc(),
                        )
                    )

                    # Do what we can to force a cleanup of broken HTSQL
                    # instances that may be stuck in tracebacks, etc.
                    sys.exc_clear()
                    gc.collect()

                    if entry.halt_on_failure:
                        raise Error('Halting RunList due to creation error')

    def determine_runlist(self):
        if self.runlist and (self.owner or self.definition):
            raise Error(
                'Cannot specify both a runlist and owner/definition'
                ' combinations'
            )

        definitions = [defn['id'] for defn in get_all_definitions()]
        validator = RunListVal()
        if self.runlist:
            if ':' in self.runlist:
                open_func = get_packages().open
            else:
                open_func = open

            try:
                runlist = open_func(self.runlist).read()
            except Exception as exc:
                raise Error(
                    'Could not open "%s": %s' % (
                        self.runlist,
                        str(exc),
                    )
                )
            else:
                runlist = validator.parse(runlist)

        else:
            if not self.definition:
                raise Error(
                    'You must specify at least one definition (%s)' % (
                        ', '.join(definitions),
                    )
                )
            if not self.owner:
                raise Error(
                    'You must specify at least one owner'
                )

            params = {
                key: value
                for key, value in self.param
            }
            entries = []
            for owner in self.owner:
                for definition in self.definition:
                    entry = {
                        'owner': owner,
                        'definition': definition,
                        'halt_on_failure': self.halt_on_failure,
                        'purge_on_failure': not self.keep_on_failure,
                        'leave_incomplete': self.leave_incomplete,
                    }
                    if params:
                        entry['parameters'] = params
                    entries.append(entry)

            runlist = validator(entries)  # pylint: disable=not-callable

        definitions = [defn['id'] for defn in get_all_definitions()]
        for entry in runlist:
            if entry.definition not in definitions:
                raise Error(
                    '"%s" is not a valid definition' % (
                        entry.definition,
                    )
                )

        return runlist

    def execute(self, entry):
        if not MartAccessPermissions.top().user_can_access_definition(
                entry.owner,
                entry.definition):
            self.execution_log(
                'Skipping Mart creation for owner=%s, definition=%s (owner'
                ' not allowed to access definition)' % (
                    entry.owner,
                    entry.definition,
                )
            )
            return

        self.execution_log(
            'Starting Mart creation for owner=%s, definition=%s' % (
                entry.owner,
                entry.definition,
            )
        )
        creator = MartCreator(entry.owner, entry.definition)
        creator(
            purge_on_failure=entry.purge_on_failure,
            leave_incomplete=entry.leave_incomplete,
            logger=self.execution_log,
            parameters=entry.parameters,
        )

    def _execution_output(self, msg, writer):
        # pylint: disable=no-self-use
        msg = '\n'.join([
            '%s %s' % ((datetime.now() if idx == 0 else (' ' * 26)), line)
            for idx, line in enumerate(msg.splitlines())
        ])
        writer(msg)

    def execution_log(self, msg):
        self._execution_output(msg, log)

    def execution_error(self, msg):
        def writer(msg):
            sys.stderr.write(msg + '\n')
        self._execution_output(msg, writer)


class MartShellTask(RexTask):
    """
    open HTSQL shell to Mart database

    The mart-shell task opens an HTSQL shell to the specified Mart database.

    If the first argument to this task is an integer, then a connection is
    opened to the Mart whose ID/code is that integer.

    If the first argument to this task is a string, then a connection is opened
    to the Mart whose database name is that string.

    If you use the --reference option, the first argument will be treated as
    the owner, and the reference will specify which of their Marts to open.
    """

    name = 'mart-shell'

    class arguments(object):  # noqa
        code_name_owner = argument(str)

    class options(object):  # noqa
        reference = option(
            'r',
            str,
            default=None,
            hint='Specifies which of the owner\'s Mart databases to connect'
            ' to. It must be in the form <DEFINITION_ID>@latest or'
            ' <DEFINITION_ID>@<NUMBER>, where <NUMBER> is the index of the'
            ' Marts of that Definition for the user (foo@1 would be the most'
            ' recent foo Mart created, etc).',
        )

    def __call__(self):
        with self.make():
            if self.reference:
                database = self.get_reference_database()
            else:
                database = self.get_named_database()

        script = HTSQL_CTL(sys.stdin, sys.stdout, sys.stderr)
        routine = RexShellRoutine(script, database)
        try:
            routine.run()
        except ScriptError as exc:  # pragma: no cover
            raise Error(str(exc))

    def get_reference_database(self):
        parts = self.reference.split('@', 1)
        if len(parts) != 2:
            raise Error(
                'The reference must be in the form <DEFINITION>@latest or'
                ' <DEFINITION>@<NUMBER>'
            )
        definition_id, latest_or_index = parts
        try:
            latest_or_index = int(latest_or_index)
        except ValueError:
            if latest_or_index != 'latest':
                raise Error(
                    'The reference must be in the form <DEFINITION>@latest or'
                    ' <DEFINITION>@<NUMBER>'
                )

        marts = MartAccessPermissions.top().get_marts_for_user(
            self.code_name_owner,
            definition_id=definition_id,
        )
        if not marts:
            raise Error('No matching Marts found')

        if latest_or_index == 'latest':
            return marts[0].get_htsql()
        else:
            if len(marts) < latest_or_index:
                raise Error('No matching Marts found')
            return marts[latest_or_index - 1].get_htsql()

    def get_named_database(self):
        database = get_management_db()
        try:
            code = int(self.code_name_owner)
        except ValueError:
            data = database.produce(
                '/rexmart_inventory?name=$name',
                name=self.code_name_owner,
            )
        else:
            data = database.produce(
                '/rexmart_inventory[$code]',
                code=code,
            )

        if data:
            mart = Mart.from_record(data[0])
        else:
            raise Error('No Mart exists with code/name "%s"' % (
                self.code_name_owner,
            ))

        return mart.get_htsql()


class MartPurgeTask(RexTask):
    """
    purge Mart database(s)

    The mart-purge task will delete the specified Mart databases from the
    system.

    You can specify the Mart(s) to purge using the --owner, --definition,
    --name, --code, and --all options. Using more than one option type will
    act as a logical AND operation when filtering the list of Marts. Using an
    option more than once will act as a logical OR operation between all values
    specified for that option.
    """

    name = 'mart-purge'

    class options(object):  # noqa
        owner = option(
            'o',
            str,
            default=(),
            plural=True,
            hint='The owner of the Mart(s) to purge. This option may be'
            ' repeated to specify multiple owners.',
        )

        definition = option(
            'd',
            str,
            default=(),
            plural=True,
            hint='The Definition ID of the Mart(s) to purge. This option may'
            ' be repeated to specify multiple Definitions.',
        )

        name = option(
            'n',
            str,
            default=(),
            plural=True,
            hint='The name of the Mart database(s) to purge. This option may'
            ' be repeated to specify multiple databases.',
        )

        code = option(
            'c',
            str,
            default=(),
            plural=True,
            hint='The unique Code/ID of the Mart(s) to purge. This option may'
            ' be repeated to specify multiple Marts.',
        )

        all = option(
            'a',
            str,
            hint='Indicates that ALL Marts in the system should be purged'
            ' (regardless of any other criteria specified).',
        )

        force_accept = option(
            'f',
            str,
            hint='Indicates that the Marts should be purged immediately'
            ' without prompting the user for confirmation.',
        )

    def __call__(self):
        with self.make():
            marts = self.find_eligible_marts()
            if not marts:
                log('No Marts found matching the specified criteria.')
                return

            log('You are about to purge %s Marts from the system:' % (
                len(marts),
            ))
            for mart in marts:
                log('  %s' % (self.format_mart(mart),))

            if not self.should_proceed():
                log('Purge aborted.')
                return

            for mart in marts:
                log('Purging %s...' % (self.format_mart(mart),))
                mart.purge()

            log('Purge complete.')

    def find_eligible_marts(self):
        if not any([
                self.owner,
                self.definition,
                self.name,
                self.code,
                self.all]):
            raise Error('You must specify some selection criteria')

        query = '/rexmart_inventory'
        parameters = {}
        if not self.all:
            if self.owner:
                query += '.filter(owner=$owner)'
                parameters.update({'owner': self.owner})
            if self.definition:
                query += '.filter(definition=$definition)'
                parameters.update({'definition': self.definition})
            if self.name:
                query += '.filter(name=$name)'
                parameters.update({'name': self.name})
            if self.code:
                query += '.filter(code=$code)'
                parameters.update({'code': self.code})
        query += '.sort(code)'

        marts = []
        data = get_management_db().produce(query, **parameters)
        for record in data:
            marts.append(Mart.from_record(record))

        return marts

    def should_proceed(self):
        if self.force_accept:
            return True

        response = raw_input('Are you sure you want to continue? (y/N): ')
        if response and response.lower()[0] == 'y':
            return True

        return False

    def format_mart(self, mart):
        # pylint: disable=no-self-use
        return '#%s: %s (owner=%s, definition=%s)' % (
            mart.code,
            mart.name,
            mart.owner,
            mart.definition_id,
        )

