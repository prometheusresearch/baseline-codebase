
from htsql.core.adapter import Adapter, adapt, call
from htsql.core.error import Error
from htsql.core.cmd.summon import Summon, recognize
from htsql.core.cmd.command import Command
from htsql.core.cmd.act import Act, ProduceAction, produce, analyze, act
from htsql.core.domain import RecordDomain, Record
from htsql.core.fmt.emit import emit
from htsql.core.connect import transaction

from rex.core import get_rex
from rex.asynctask import get_transport
import json


class SummonSubmitTabularImportTask(Summon):

    call('submit_tabular_import_task')

    def __call__(self):
        if len(self.arguments) != 2:
            raise Error("Expected two arguments")
        table_feed = recognize(self.arguments[0])
        file_feed = recognize(self.arguments[1])
        return SubmitTabularImportTaskCmd(table_feed, file_feed)


class SubmitTabularImportTaskCmd(Command):

    def __init__(self, table_feed, file_feed):
        self.table_feed = table_feed
        self.file_feed = file_feed


class ProduceSubmitTabularImportTask(Act):

    adapt(SubmitTabularImportTaskCmd, ProduceAction)

    def __call__(self):
        with transaction():
            return self.execute()

    def execute(self):
        table = act(self.command.table_feed, self.action)
        file = act(self.command.file_feed, self.action)
        with get_rex():
            product = produce("""insert(import_job := {
                user := $USER,
                table := $table,
                file := $file
            })""", table=table, file=file)
            get_transport().submit_task("tabular_import",
                    json.dumps({'id': str(product.data)}))
            return product
