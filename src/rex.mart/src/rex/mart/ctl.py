#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from datetime import datetime

from htsql.ctl import HTSQL_CTL
from htsql.ctl.error import ScriptError
from rex.db.ctl import RexShellRoutine
from rex.core import Error
from rex.ctl import RexTask, argument, option, log

from .config import get_all_definitions
from .connections import get_mart_db, get_management_db
from .creation import MartCreator
from .mart import Mart
from .permissions import MartAccessPermissions
from .validators import RunListVal


__all__ = (
    'MartCreateTask',
    'MartShellTask',
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
            ' --definition options cannot be used.',
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
            hint='Indiciates whether or not to leave the status of Marts open.'
            ' If not specified, Marts will automatically be marked as'
            ' "complete", meaning they can be accessed by front-end users.',
        )

    def __call__(self):
        with self.make():
            runlist = self.determine_runlist()
            for entry in runlist:
                try:
                    self.execute(entry)
                except Error as exc:
                    self.execution_error(
                        'Mart creation for %r failed: %s' % (
                            entry,
                            exc,  # TODO stack trace?
                        )
                    )
                    if entry.halt_on_failure:
                        raise Error('Halting RunList due to creation error')

    def determine_runlist(self):
        if self.runlist and (self.owner or self.definition):
            raise Error(
                'Cannot specify both a runlist and owner/definition'
                ' combinations'
            )

        validator = RunListVal()
        if self.runlist:
            try:
                runlist = open(self.runlist, 'r').read()
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
            if not self.owner or not self.definition:
                raise Error(
                    'You must specify at least one owner and definition'
                )

            entries = []
            for owner in self.owner:
                for definition in self.definition:
                    entries.append({
                        'owner': owner,
                        'definition': definition,
                        'halt_on_failure': self.halt_on_failure,
                        'purge_on_failure': not self.keep_on_failure,
                        'leave_incomplete': self.leave_incomplete,
                    })

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
            return get_mart_db(marts[0].name)
        else:
            if len(marts) < latest_or_index:
                raise Error('No matching Marts found')
            return get_mart_db(marts[latest_or_index - 1].name)

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

        return get_mart_db(mart.name)

