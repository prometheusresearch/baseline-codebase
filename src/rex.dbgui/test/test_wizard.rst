Generating Wizard
=================

DBGUI could generate wizards on a different database schemas. Here is an example of the simple schema which includes trunk, branch, cross and facets::


  >>> from rex.core import Rex
  >>> from rex.dbgui import root_wizard, table_wizard
  >>> import yaml
  >>> app = Rex('rex.dbgui_demo', db='pgsql:dbgui_demo', attach_dir='./build')
  >>> def print_wizard(table):
  ...     with app:
  ...         wizard = table_wizard(table)
  ...         assert isinstance(wizard.wizard, object)
  ...         print yaml.safe_dump(table_wizard(table), indent=2,
  ...                              default_flow_style=False)


  >>> print_wizard('trunk') # doctest: +ELLIPSIS
  /trunk:
    action:
      id: trunk
      type: wizard
      title: 'DBGUI: trunk'
      path:
      - pick-trunk:
        - view-trunk:
          - edit-trunk:
            - replace: ../../../pick-trunk/view-trunk
          - view-facet:
            - edit-facet:
              - replace: ../../view-facet
        - pick-branch:
          - view-branch:
            - edit-branch:
              - replace: ../../../pick-branch/view-branch
          - drop-branch:
          - make-branch:
            - replace: ../../pick-branch/view-branch
        - pick-cross:
          - view-cross:
            - edit-cross:
              - replace: ../../../pick-cross/view-cross
          - drop-cross:
          - make-cross:
            - replace: ../../pick-cross/view-cross
        - drop-trunk:
        - make-trunk:
          - replace: ../../pick-trunk/view-trunk
      - view-source:
      actions:
        pick-trunk:
          type: pick
          title: Pick trunk
          entity:
            trunk: trunk
          fields:
          - expression: string(id())
            label: id()
            type: calculation
            value_key: id
          - t_id
          search: string(id())~$search
          search_placeholder: Search by ID
        view-trunk:
          type: view
          title: View trunk
          entity:
            trunk: trunk
          fields:
          - t_id
          - t_data
        edit-trunk:
          type: edit
          title: Edit trunk
          entity:
            trunk: trunk
          fields:
          - t_id
          - t_data
        view-facet:
          type: view
          title: View facet
          entity:
            trunk: trunk
          input:
          - trunk: trunk
          fields:
          - facet.f_text
          - facet.f_int
        edit-facet:
          type: edit
          title: Edit facet
          entity:
            trunk: trunk
          input:
          - trunk: trunk
          value:
            trunk: $trunk
          fields:
          - facet.f_text
          - facet.f_int
        pick-branch:
          type: pick
          title: Pick branch
          entity:
            branch: branch
          input:
          - trunk: trunk
          fields:
          - expression: string(id())
            label: id()
            type: calculation
            value_key: id
          - b_id
          mask: trunk=$trunk
          search: string(id())~$search
          search_placeholder: Search by ID
        view-branch:
          type: view
          title: View branch
          entity:
            branch: branch
          input:
          - trunk: trunk
          fields:
          - b_id
          - b_data
        edit-branch:
          type: edit
          title: Edit branch
          entity:
            branch: branch
          input:
          - trunk: trunk
          value:
            trunk: $trunk
          fields:
          - b_id
          - b_data
        drop-branch:
          type: drop
          title: Drop branch
          entity:
            branch: branch
        make-branch:
          type: make
          title: Make branch
          entity:
            branch: branch
          input:
          - trunk: trunk
          value:
            trunk: $trunk
          fields:
          - b_id
          - b_data
        pick-cross:
          type: pick
          title: Pick cross
          entity:
            cross: cross
          input:
          - trunk: trunk
          fields:
          - expression: string(id())
            label: id()
            type: calculation
            value_key: id
          - cross_partner
          mask: trunk=$trunk
          search: string(id())~$search
          search_placeholder: Search by ID
        view-cross:
          type: view
          title: View cross
          entity:
            cross: cross
          input:
          - trunk: trunk
          fields:
          - cross_partner
        edit-cross:
          type: edit
          title: Edit cross
          entity:
            cross: cross
          input:
          - trunk: trunk
          value:
            trunk: $trunk
          fields:
          - cross_partner
        drop-cross:
          type: drop
          title: Drop cross
          entity:
            cross: cross
        make-cross:
          type: make
          title: Make cross
          entity:
            cross: cross
          input:
          - trunk: trunk
          value:
            trunk: $trunk
          fields:
          - cross_partner
        drop-trunk:
          type: drop
          title: Drop trunk
          entity:
            trunk: trunk
        make-trunk:
          type: make
          title: Make trunk
          entity:
            trunk: trunk
          fields:
          - t_id
          - t_data
  ...

