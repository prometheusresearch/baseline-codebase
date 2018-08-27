/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import {style} from 'react-dom-stylesheet';

import {FormEntry, FormEditor} from 'rex-forms';
import {Provider} from 'rex-i18n';

import JsonViewer from '../jsonviewer';


let WorkspaceContainer = style('div', {
  display: 'flex',
});

let FormContainer = style('div', {
  flexGrow: 1,
  margin: '10px'
});

let AssessmentContainer = style('div', {
  fontSize: '80%',
  width: '35%',
  overflow: 'auto',
  padding: 16,
  invalid: {
    color: 'red'
  }
});

let ErrorContainer = style('div', {
  width: '20%'
});

let Error = function ({error}) {
  return (
    <div style={{marginBottom: '1em'}}>
      <dt style={{fontWeight: 'bold'}}>{error.field}</dt>
      <dd>{error.message}</dd>
    </div>
  );
};

export default class Workspace extends React.Component {

  static propTypes = {
    mountPoint: React.PropTypes.string.isRequired,
    apiUrls: React.PropTypes.object.isRequired,
    i18nUrl: React.PropTypes.string.isRequired,
    demo: React.PropTypes.object.isRequired,
    options: React.PropTypes.object
  };

  static defaultProps = {
    options: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      assessment: {},
      isValid: false,
      errors: []
    };
  }

  onFormChange = (state) => {
    this.logEvent('onChange', state, state.isValid(), state.getErrors());
    this.setState({
      assessment: state.getAssessment(),
      isValid: state.isValid(),
      errors: state.getErrors()
    });
  };

  logEvent(name, ...args) {
    if (this.props.options.logFormEvents) {
      console.log(new Date(), name, args);
    }
  }

  render() {
    let Component = this.props.options.component === 'EDITOR' ? FormEditor : FormEntry;

    if (this.props.demo.id === 'custom_widget') {
      Component = require('../CustomWidgetDemo').default;
    }

    return (
      <Provider
        locale={this.props.options.locale}
        baseUrl={this.props.i18nUrl}>
        <WorkspaceContainer>
          <FormContainer>
            <Component
              Form={this.props.options.component === 'EDITOR' ? FormEditor : FormEntry}
              mode={this.props.options.mode}
              instrument={this.props.demo.instrument}
              form={this.props.demo.form}
              assessment={this.props.demo.assessment}
              parameters={this.props.demo.parameters}
              noPagination={this.props.options.noPagination}
              showCalculations={!!this.props.demo.calculationset}
              apiUrls={this.props.apiUrls}
              onChange={this.onFormChange}
              onPage={this.logEvent.bind(this, 'onPage')}
              onSave={this.logEvent.bind(this, 'onSave')}
              onReview={this.logEvent.bind(this, 'onReview')}
              onComplete={this.logEvent.bind(this, 'onComplete')}
              />
          </FormContainer>
          {this.props.options.showAssessment &&
            <AssessmentContainer variant={{invalid: !this.state.isValid}}>
              <JsonViewer
                object={this.state.assessment}
                />
            </AssessmentContainer>
          }
          {this.props.options.showErrors &&
            <ErrorContainer>
              {this.state.errors.map((error, idx) => {
                return <Error error={error} key={idx} />;
              })}
            </ErrorContainer>
          }
        </WorkspaceContainer>
      </Provider>
    );
  }
}
