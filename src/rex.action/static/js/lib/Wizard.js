/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react/addons');
var {cloneWithProps}          = React.addons;
var RexWidget                 = require('rex-widget');
var {VBox, HBox}              = RexWidget.Layout;
var {boxShadow, border,
     translate3d, rgb, borderStyle,
     overflow, transform}     = RexWidget.StyleUtils;
var Breadcrumb                = require('./Breadcrumb');
var Actions                   = require('./Actions');
var WithDOMSize               = require('./WithDOMSize');
var WizardState               = require('./WizardState')
var WizardPanel               = require('./WizardPanel');

var Style = {

  self: {
    flex: 1,
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
    flex: 1,
    background: rgb(234)
  },

  itemsCanvas: {
    flex: 1,
    transition: transform(0.5)
  }
};

var Wizard = React.createClass({

  render() {
    if (this.props.DOMSize === null) {
      return <VBox style={Style.self} />;
    } else {
      var translateX = -this.state.wizard.canvasMetrics.translateX;
      return (
        <VBox style={Style.self}>
          <VBox style={Style.items}>
            <HBox style={{...Style.itemsCanvas, transform: translate3d(translateX, 0, 0)}}>
              {this.renderPanels()}
            </HBox>
          </VBox>
          <VBox style={Style.breadcrumb}>
            {this.renderBreadcrumb()}
          </VBox>
        </VBox>
      );
    }
  },

  renderPanels() {
    var {wizard} = this.state;
    return wizard.panels.map((panel, idx) => (
      <WizardPanel
        key={panel.id + '__' + (panel.isService ? 'SERVICE' : getPanelKey(panel))}
        actionId={panel.id}
        actions={this.props.actions.actions}
        siblingActions={panel.isService ? [] : Object.keys(panel.prev.actionTree)}
        active={wizard.canvasMetrics.visiblePanels.indexOf(idx) !== -1}
        noTheme={panel.isService}
        style={{...Style.item, zIndex: panel.isService ? 999 : 1000}}
        onReplace={this.onReplace}
        onFocus={this.onFocus}>
        {cloneWithProps(panel.element, {
          context: {...panel.context, USER: "'" + __REX_USER__ + "'"},
          wizard: wizard,
          onContext: this.onContext.bind(null, panel.id),
          onClose: idx > 0 ? this.onClose.bind(null, panel.id) : undefined
        })}
      </WizardPanel>
    ));
  },

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
  },

  getInitialState() {
    return {
      wizard: null
    };
  },

  componentWillReceiveProps({DOMSize}) {
    if (DOMSize !== this.props.DOMSize) {
      var wizard = this.state.wizard;
      if (wizard === null) {
        wizard = WizardState.construct(this._onWizardUpdate, this.props.actions, DOMSize);
      } else {
        wizard = wizard.resize(DOMSize);
      }
      this.setState({wizard});
    }
  },

  _onWizardUpdate(wizard) {
    if (wizard !== this.state.wizard) {
      this.setState({wizard});
    }
  },

  onReplace(id, replaceId) {
    this.state.wizard.update(wizard => wizard
      .close(id)
      .openAfterLast(replaceId));
  },

  onContext(id, context) {
    this.state.wizard.update(wizard => wizard
      .updateContext(id, context));
  },

  onFocus(id) {
    this.state.wizard.update(wizard => wizard
      .ensureVisible(id));
  },

  onBreadcrumbClick(id) {
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
  },

  onClose(id) {
    this.state.wizard.update(wizard => {
      wizard = wizard.close(id);
      wizard = wizard.ensureVisible(wizard.last.id);
      return wizard;
    });
  }

});

function getPanelKey(panel) {
  var inputKeys = Object.keys(panel.element.props.contextSpec.input);
  return inputKeys.map(k => panel.context[k]).join('__');
}

Wizard = WithDOMSize(Wizard);

module.exports = Wizard;
