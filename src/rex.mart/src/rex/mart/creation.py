#
# Copyright (c) 2015, Prometheus Research, LLC
#


import gc
import sys

from datetime import datetime

from rex.core import Error, get_settings

from .assessments import AssessmentLoader
from .config import get_definition
from .connections import get_management_db, get_hosting_cluster, \
    get_mart_etl_db, get_sql_connection
from .mart import Mart
from .purging import purge_mart
from .util import extract_htsql_statements, guarded


__all__ = (
    'MartCreator',
)


HTSQL_CREATE_INVENTORY = '''{
    definition:=$definition,
    owner:=$owner,
    name:='TBD',
    status:='creation',
    date_creation_started:=$date_creation_started
} :as rexmart_inventory
/:insert'''

HTSQL_UPDATE_STATUS = '''/rexmart_inventory{
    id(),
    status:=$status
}.filter(
    code=$code
)
/:update'''

HTSQL_UPDATE_NAME = '''/rexmart_inventory{
    id(),
    name:=$name
}.filter(
    code=$code
)
/:update'''

HTSQL_UPDATE_DATE_COMPLETED = '''/rexmart_inventory{
    id(),
    date_creation_completed:=$date_completed
}.filter(
    code=$code
)
/:update'''


class MartCreator(object):
    """
    A class that encapsulates the process of creating a Mart database.
    """

    def __init__(self, owner, definition):
        """
        :param owner: the owner of the resulting Mart
        :type owner: str
        :param definition: the ID of the definition to use in creation
        :type definition: str
        """

        self.owner = owner or None
        self.start_date = None
        self.code = None
        self.name = None
        self.database = None
        self.logger = None

        self.definition = get_definition(definition)
        if not self.definition:
            raise Error('Unknown definition "%s"' % (definition,))

    def __call__(
            self,
            purge_on_failure=True,
            leave_incomplete=False,
            logger=None):
        """
        Executes the creation of a Mart database.

        :param purge_on_failure:
            whether or not to delete the Mart database if an error was
            encountered during its creation; if not specified, defaults to
            True
        :type purge_on_failure: bool
        :param leave_incomplete:
            whether or not to set the final ``complete`` status on the
            inventory record after creating the Mart; if not specified,
            defaults to False, which means it **will** be marked ``complete``
        :type leave_incomplete: bool
        :param logger:
            the function to call to output a message about the progress of the
            creation
        :type logger: function
        :returns:
            a dict with the ``name`` of the newly-created Mart, as well as the
            ``code`` of the associated inventory record
        """

        with guarded('While creating Mart database:', self.definition['id']):
            try:
                # Setup
                self.start_date = datetime.now()
                self.logger = logger
                self.log('Mart creation began: %s' % (self.start_date,))
                self.code = self.create_inventory()
                self.name = self.establish_name()

                # Creation
                self.create_mart()

                # Deployment
                self._update_status('deployment')
                self.deploy_structures()

                # Post Deployment ETL
                self._update_status('post_deployment')
                self.log('Executing Post-Deployment ETL...')
                with guarded('While executing Post-Deployment Scripts'):
                    self.execute_etl(self.definition['post_deploy_scripts'])
                self.log('...ETL complete')

                # Assessment ETL
                self._update_status('assessment')
                self.load_assessments()

                # Post Assessment ETL
                self._update_status('post_assessment')
                self.log('Executing Post-Assessment ETL...')
                with guarded('While executing Post-Assessment Scripts'):
                    self.execute_etl(
                        self.definition['post_assessment_scripts'],
                    )
                self.log('...ETL complete')

                # Post-Processors
                self._update_status('processing')
                # TODO run post-processors

                # Mark things complete
                self._update_date_completed()
                if not leave_incomplete:
                    self._update_status('complete')

                mart = self._get_mart()
                self.log('Mart creation complete: %s' % (
                    mart.date_creation_completed,
                ))
                self.log('Mart creation duration: %s' % (
                    mart.date_creation_completed - mart.date_creation_started,
                ))
                return mart

            except:
                exc_info = sys.exc_info()
                if self.code and purge_on_failure:
                    try:
                        purge_mart(self.code)
                    except:  # pylint: disable=pointless-except,bare-except
                        # Be quiet so the original exception can raised
                        pass
                raise exc_info[0], exc_info[1], exc_info[2]

            finally:
                self.close_mart()
                self.code = None
                self.name = None
                self.start_date = None
                self.logger = None

    def log(self, msg):
        if not self.logger:
            return
        self.logger(msg)

    def _get_mart(self):
        database = get_management_db()
        data = database.produce('/rexmart_inventory[$code]', code=self.code)
        return Mart.from_record(data[0])

    def _do_update(self, query, **parameters):  # pylint: disable=no-self-use
        database = get_management_db()
        database.produce(query, **parameters)

    def _update_status(self, status):
        with guarded('While updating inventory status:', status):
            self._do_update(
                HTSQL_UPDATE_STATUS,
                code=self.code,
                status=status,
            )

    def _update_date_completed(self):
        with guarded('While updating inventory date'):
            self._do_update(
                HTSQL_UPDATE_DATE_COMPLETED,
                code=self.code,
                date_completed=datetime.now(),
            )

    def create_inventory(self):
        with guarded('While creating inventory record'):
            database = get_management_db()
            data = database.produce(
                HTSQL_CREATE_INVENTORY,
                definition=self.definition['id'],
                owner=self.owner,
                date_creation_started=self.start_date,
            )
            return int(str(data.data))

    def establish_name(self):
        if self.definition['base']['type'] == 'existing':
            name = self.definition['base']['target']
        else:
            name_parts = []
            if get_settings().mart_name_prefix:
                name_parts.append(get_settings().mart_name_prefix)
            name_parts.append(self.definition['base']['name_token'])
            name_parts.append(str(self.code))
            name_parts.append('_')
            name_parts.append(self.start_date.strftime('%Y%m%d%H%M%S'))
            name = ''.join(name_parts)

        with guarded('While updating inventory name:', name):
            self._do_update(
                HTSQL_UPDATE_NAME,
                code=self.code,
                name=name,
            )

        return name

    def create_mart(self):
        cluster = get_hosting_cluster()
        if self.definition['base']['type'] in ('fresh', 'copy'):
            self.log('Creating database: %s' % (self.name,))
            to_clone = None
            if self.definition['base']['type'] == 'copy':
                to_clone = self.definition['base']['target']
                self.log('Cloning: %s' % (to_clone,))

            with guarded('While creating database:', self.name):
                cluster.create(self.name, template=to_clone)

        elif self.definition['base']['type'] == 'existing':
            self.log('Using existing database: %s' % (self.name,))
            if not cluster.exists(self.name):
                raise Error(
                    'Database "%s" does not exist' % (
                        self.name,
                    )
                )

        else:  # pragma: no cover
            raise Error('Unknown base type "%s"' % (
                self.definition['base']['type'],
            ))

    def _do_deploy(self, facts):
        cluster = get_hosting_cluster()
        driver = cluster.drive(self.name)
        driver(facts)
        driver.commit()
        driver.close()
        if self.database:
            self.close_mart()
            self.connect_mart()

    def deploy_structures(self):
        if not self.definition['deploy']:
            return

        self.log('Deploying structures...')
        with guarded('While Deploying structures'):
            self._do_deploy(self.definition['deploy'])

    def execute_etl(self, scripts):
        if not scripts:
            return

        self.connect_mart()

        for idx, script in enumerate(scripts):
            idx_label = '#%s' % (idx + 1,)
            self.log('%s script %s...' % (
                script['type'].upper(),
                idx_label,
            ))

            parameters = {}
            parameters.update(script['parameters'])
            parameters['OWNER'] = self.owner
            parameters['DEFINITION'] = self.definition['id']

            if script['type'] == 'htsql':
                statements = extract_htsql_statements(script['script'])
                with guarded('While executing HTSQL script:', idx_label):
                    for statement in statements:
                        with guarded('While executing statement:', statement):
                            self.database.produce(statement, **parameters)

            elif script['type'] == 'sql':
                with guarded('While executing SQL script:', idx_label):
                    with get_sql_connection(self.database) as sql:
                        cursor = sql.cursor()
                        try:
                            cursor.execute(script['script'], parameters)
                        finally:
                            cursor.close()

            else:  # pragma: no cover
                raise Error('Unknown script type "%s"' % (
                    script['type'],
                ))

    def load_assessments(self):
        if not self.definition['assessments']:
            return

        for idx, assessment in enumerate(self.definition['assessments']):
            idx_label = '#%s' % (idx + 1,)
            self.log('Processing Assessment %s' % (idx_label,))

            with guarded('While processing Assessment:', idx_label):
                self.connect_mart()
                loader = AssessmentLoader(assessment, self.database)

                with guarded('While deploying Assessment structures'):
                    self.log('...deploying structures')
                    self._do_deploy(loader.get_deploy_facts())

                with guarded('While loading Assessments'):
                    self.log('...loading Assessments')
                    num_loaded = loader.load(self.database)
                    self.log('...%s Assessments loaded' % (
                        num_loaded,
                    ))

                with guarded('While performing Assessment calculations'):
                    self.log('...performing calculations')
                    loader.do_calculations(self.database)

                self.log('...complete')

    def connect_mart(self):
        if not self.database:
            self.database = get_mart_etl_db(self.name)

    def close_mart(self):
        # Force collection of the HTSQL instance to try to avoid corrupting
        # future instances.
        self.database = None
        gc.collect()

