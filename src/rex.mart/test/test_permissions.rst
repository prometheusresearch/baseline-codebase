***********
Permissions
***********


Set up the environment::

    >>> from datetime import datetime
    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_hosting_cluster=cluster)
    >>> rex.on()

    >>> from rex.mart import MartAccessPermissions, Mart, MartCreator
    >>> permissions = MartAccessPermissions


The default behavior of the ``user_can_access_definition`` method is to always
return True::

    >>> permissions.user_can_access_definition('permtest', 'empty')
    True
    >>> permissions.user_can_access_definition('permtest', 'doesntexist')
    True
    >>> permissions.user_can_access_definition('doesntexist', 'empty')
    True


The default behavior of the ``user_can_access_mart`` method is to return True
if the owner of the Mart is the same as the user::

    >>> mc = MartCreator('permtest', 'empty')
    >>> mart = mc()
    >>> permissions.user_can_access_mart('permtest', mart.code)
    True
    >>> permissions.user_can_access_mart('someoneelse', mart.code)
    False

    >>> mart = Mart(999, 'empty', 'permtest', 'dbname', datetime.now(), datetime.now(), False, 123, 'complete')
    >>> permissions.user_can_access_mart('permtest', mart)
    True
    >>> permissions.user_can_access_mart('someoneelse', mart)
    False


The default behavior of the ``user_can_manage_mart`` method is to mimic the
behavior of the ``user_can_access_mart``::

    >>> mc = MartCreator('permtest', 'empty')
    >>> mart = mc()
    >>> permissions.user_can_manage_mart('permtest', mart.code)
    True
    >>> permissions.user_can_manage_mart('someoneelse', mart.code)
    False

    >>> mart = Mart(999, 'empty', 'permtest', 'dbname', datetime.now(), datetime.now(), False, 123, 'complete')
    >>> permissions.user_can_manage_mart('permtest', mart)
    True
    >>> permissions.user_can_manage_mart('someoneelse', mart)
    False


The default behavior of the ``get_definitions_for_user`` method is to return
definitions that pass the ``user_can_access_definition`` method::

    >>> definitions = permissions.get_definitions_for_user('permtest')
    >>> [defn['id'] for defn in definitions]
    ['empty', 'just_copy', 'just_copy_missing', 'just_copy_application', 'just_deploy', 'just_deploy_includes', 'some_data', 'some_more_data', 'some_sql_data', 'some_more_sql_data', 'both_etl_phases', 'some_data_with_params', 'existing', 'fixed_name', 'existing_missing', 'broken_htsql', 'broken_sql', 'simple_assessment', 'linked_assessment', 'linked_assessment_alltypes', 'calculated_assessment', 'overlap_names_assessment', 'select_json', 'broken_selector', 'datadictionary_deployment', 'datadictionary_assessment', 'datadictionary_alltypes', 'index_processor', 'analyze_processor', 'enum_values', 'some_parameters', 'form_metadata']

    >>> definitions = permissions.get_definitions_for_user('someoneelse')
    >>> [defn['id'] for defn in definitions]
    ['empty', 'just_copy', 'just_copy_missing', 'just_copy_application', 'just_deploy', 'just_deploy_includes', 'some_data', 'some_more_data', 'some_sql_data', 'some_more_sql_data', 'both_etl_phases', 'some_data_with_params', 'existing', 'fixed_name', 'existing_missing', 'broken_htsql', 'broken_sql', 'simple_assessment', 'linked_assessment', 'linked_assessment_alltypes', 'calculated_assessment', 'overlap_names_assessment', 'select_json', 'broken_selector', 'datadictionary_deployment', 'datadictionary_assessment', 'datadictionary_alltypes', 'index_processor', 'analyze_processor', 'enum_values', 'some_parameters', 'form_metadata']


The default behavior of the ``get_mart`` method is to retrieve the Mart and
use the ``user_can_access_mart`` method to make judgements about access::

    >>> mc = MartCreator('permtest', 'empty')
    >>> mart = mc()
    >>> permissions.get_mart(123456, 'permtest') is None
    True
    >>> permissions.get_mart(mart.code, 'permtest')  # doctest: +ELLIPSIS
    Mart(code=..., definition=u'empty', owner=u'permtest')
    >>> permissions.get_mart(mart.code, 'someoneelse')
    False


The default behavior of the ``get_marts_for_user`` method is to retrieve the
Marts and use the ``user_can_access_mart`` and ``user_can_access_definition``
method to make judgements about access::

    >>> marts = permissions.get_marts_for_user('permtest')
    >>> len(marts) > 0
    True

    >>> marts = permissions.get_marts_for_user('permtest', definition_id='empty')
    >>> len(marts) > 0
    True



    >>> rex.off()

