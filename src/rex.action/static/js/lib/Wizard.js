/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import RexWidget          from 'rex-widget';
import Breadcrumb         from './Breadcrumb';
import Actions            from './Actions';
import WithDOMSize        from './WithDOMSize';
import WizardState        from './WizardState';
import WizardPanel        from './WizardPanel';
import WizardHistory      from './WizardHistory';

let {VBox, HBox} = RexWidget.Layout;

let {
  boxShadow, border,
  translate3d, rgb, borderStyle,
  overflow, transform
} = RexWidget.StyleUtils;

let Style = {

  self: {
    width: '100%',
    height: '100%',
    overflow: overflow.hidden
  },

  breadcrumb: {
    width: '100%',
    height: 38,
    boxShadow: boxShadow(0, 3, 6, 2, rgb(226)),
    borderTop: border(1, borderStyle.solid, rgb(234))
  },

  item: {
    marginRight: 15
  },

  items: {
    overflow: overflow.hidden,
    width: '100%',
    background: rgb(234)
  },

  itemsCanvas: {
    transition: transform(0.5)
  }
};

@WithDOMSize
export default class Wizard extends React.Component {

  static propTypes = {
    /**
     * A tree of possible wizard transitions.
     */
    path: PropTypes.object.isRequired,

    /**
     * A mapping from id to a React element which represents an action.
     */
    actions: PropTypes.object.isRequired,

    /**
     * Initial context, it is set to {} (empty context if it's not supplied).
     */
    initialContext: PropTypes.object,

    /**
     * Boolean flag which disables history for wizard if set to true.
     */
    disableHistory: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      wizard: null
    };
    this._wizardHistory = null;
    this._wizardHistory = new WizardHistory(
      this._wizardConstruct,
      this._wizardRetrieve,
      this._wizardUpdate
    );
    if (!props.disableHistory) {
      this._wizardHistory.start();
    }
  }

  render() {
    if (this.props.DOMSize === null) {
      return <VBox style={Style.self} />;
    } else {
      var translateX = -this.state.wizard.canvasMetrics.translateX;
      return (
        <VBox size={1} style={Style.self}>
          <VBox size={1} style={Style.items}>
            <HBox size={1} style={{...Style.itemsCanvas, transform: translate3d(translateX, 0, 0)}}>
              {this.renderPanels()}
            </HBox>
          </VBox>
          <VBox style={Style.breadcrumb}>
            {this.renderBreadcrumb()}
          </VBox>
        </VBox>
      );
    }
  }

  renderPanels() {
    var {wizard} = this.state;
    return wizard.panels.map((panel, idx) => (
      <WizardPanel
        key={panel.id + '__' + (panel.isService ? 'SERVICE' : getPanelKey(panel))}
        actionId={panel.id}
        actions={this.props.actions}
        siblingActions={panel.isService ? [] : Object.keys(panel.prev.actionTree)}
        active={wizard.canvasMetrics.visiblePanels.indexOf(idx) !== -1}
        noTheme={panel.isService}
        style={{...Style.item, zIndex: panel.isService ? 999 : 1000}}
        onReplace={this.onReplace}
        onFocus={this.onFocus}>
        {React.cloneElement(panel.element, {
          context: {...panel.context, USER: "'" + __REX_USER__ + "'"},
          wizard: wizard,
          onContext: this.onContext.bind(null, panel.id),
          onClose: idx > 0 ? this.onClose.bind(null, panel.id) : undefined
        })}
      </WizardPanel>
    ));
  }

  renderBreadcrumb() {
    var {wizard} = this.state;
    var items = wizard.panels.map(panel => ({
      id: panel.id,
      icon: Actions.getIcon(panel.element),
      title: Actions.getTitle(panel.element)
    }));
    var active = wizard.canvasMetrics.visiblePanels.map(i => wizard.panels[i].id);
    return (
      <Breadcrumb
        active={active}
        items={items}
        onClick={this.onBreadcrumbClick}
        />
    );
  }

  componentWillUnmount() {
    this._wizardHistory.stop();
    this._wizardHistory = null;
  }

  componentWillReceiveProps({DOMSize}) {
    if (DOMSize !== this.props.DOMSize) {
      var wizard = this.state.wizard;
      if (wizard === null) {
        if (this._wizardHistory.started) {
          wizard = WizardState.fromQueryString(
            this._wizardHistory.queryString,
            this._onWizardUpdate,
            {actions: this.props.actions, tree: this.props.path},
            DOMSize,
            this.props.initialContext
          );
        } else {
          wizard = WizardState.construct(
            this._onWizardUpdate,
            {actions: this.props.actions, tree: this.props.path},
            DOMSize,
            this.props.initialContext
          );
        }
      } else {
        wizard = wizard.resize(DOMSize);
      }
      this._onWizardUpdate(wizard);
    }
  }

  _wizardConstruct = (qs) => {
    return WizardState.fromQueryString(
        qs,
        this._onWizardUpdate,
        {actions: this.props.actions, tree: this.props.path},
        this.props.DOMSize);
  }

  _wizardRetrieve = () => {
    return this.state.wizard;
  }

  _wizardUpdate = (wizard) => {
    this.setState({wizard});
  }

  _onWizardUpdate = (wizard) => {
    if (wizard !== this.state.wizard) {
      this._wizardHistory.wizardChanged(wizard);
      this.setState({wizard});
    }
  }

  onReplace = (id, replaceId) => {
    this.state.wizard.update(wizard => wizard
      .close(id)
      .openAfterLast(replaceId));
  }

  onContext = (id, context) => {
    this.state.wizard.update(wizard => wizard
      .updateContext(id, context));
  }

  onFocus = (id) => {
    this.state.wizard.update(wizard => wizard
      .ensureVisible(id));
  }

  onBreadcrumbClick = (id) => {
    this.state.wizard.update(wizard => {
      if (wizard.isVisible(id)) {
        var idx = wizard.indexOf(id);
        if (idx < wizard.focus) {
          wizard = wizard.moveFocusLeft();
        } else if (idx > wizard.focus) {
          wizard = wizard.moveFocusRight();
        }
      } else {
        wizard = wizard.ensureVisible(id);
      }
      return wizard;
    });
  }

  onClose = (id) => {
    this.state.wizard.update(wizard => {
      wizard = wizard.close(id);
      wizard = wizard.ensureVisible(wizard.last.id);
      return wizard;
    });
  }

}

function getPanelKey(panel) {
  var inputKeys = Object.keys(panel.element.props.contextSpec.input);
  return inputKeys.map(k => panel.context[k]).join('__');
}
