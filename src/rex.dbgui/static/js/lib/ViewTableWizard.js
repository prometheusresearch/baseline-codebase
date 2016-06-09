import React from 'react';
import {Action} from 'rex-action';
import {Preloader, SuccessButton} from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Fetch} from 'rex-widget/data';
import autobind from 'autobind-decorator';
import {DataTableBase} from 'rex-widget/datatable';
import {SearchInput} from 'rex-widget/form';

@Fetch(({context, dump}) => {
  return {
    dump: dump.params(context)
  }
})
export default class ViewTableWizard extends React.Component {

  render() {
    let {title, onClose, context} = this.props;
    let {dump} = this.props.fetched;
    return (
      <Action title={`${title}: ${context.table}`}
              onClose={onClose} noContentWrapper>
        <VBox flex={1}>
          <HBox padding={5} margin={5}>
            <SuccessButton onClick={this.runWizard}>Run Wizard</SuccessButton>
          </HBox>
          <HBox flex={1} padding={5} margin={5}>
            {dump.updating ? <Preloader /> :
              <textarea
                readOnly
                value={dump.data.dump}
                style={{width: '100%'}}
                />
            }
          </HBox>
        </VBox>
      </Action>
    );
  }

  @autobind
  runWizard() {
    let url = `${__MOUNT_POINTS__['rex.dbgui']}/${this.props.context.table}`;
    window.open(url);
  }

}
