/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react/addons');
var {cloneWithProps}          = React.addons;
var RexWidget                 = require('rex-widget');
var {VBox, HBox}              = RexWidget.Layout;
var {boxShadow, border}       = RexWidget.StyleUtils;
var Breadcrumb                = require('./Breadcrumb');
var Actions                   = require('./Actions');
var WithDOMSize               = require('./WithDOMSize');
var WizardState               = require('./WizardState')
var WizardItem                = require('./WizardItem');

function getPanelWidth(panel) {
  var element = panel.element;
  var width = Actions.getWidth(element) || WizardItem.Style.self.minWidth;
  if (Object.keys(panel.prev.actionTree).length > 1) {
    width = width + WizardItem.Style.sidebar.width;
  }
  return width;
}

function computeCanvasMetrics(wizard, size, getActionByID) {
  var widthToDistribute;
  var seenWidth = 0;
  var scrollToIdx;
  var translateX = 0;
  var visiblePanels = [];
  for (var i = 0; i < wizard.panels.length; i++) {
    var panel = wizard.panels[i];
    var panelWidth = getPanelWidth(panel);
    if (i === wizard.focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panelWidth;
      if (widthToDistribute >= -10) {
        visiblePanels.push(i);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var panel = wizard.panels[i];
      var panelWidth = getPanelWidth(panel);
      translateX = translateX + panelWidth + WizardStyle.item.marginRight;
    }
  }

  translateX = Math.max(0, translateX - WizardStyle.item.marginRight * 4);

  return {
    translateX,
    visiblePanels
  };
}

var WizardStyle = {

  self: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },

  breadcrumb: {
    width: '100%',
    height: 38,
    boxShadow: boxShadow(0, 3, 6, 2, '#e2e2e2'),
    borderTop: border(1, 'solid', '#eaeaea')
  },

  item: {
    marginRight: 15
  },

  items: {
    overflow: 'hidden',
    width: '100%',
    flex: 1,

    background: '#eaeaea'
  },

  itemsCanvas: {
    flex: 1,
    transition: 'transform 0.5s'
  }
};


var Wizard = React.createClass({

  render() {
    if (this.props.DOMSize === null) {
      return <VBox style={WizardStyle.self} />;
    }

    var {translateX, visiblePanels, actionTree} = this.state;
    var panels = this.state.wizard.panels.map((p, i) => {
      var key;
      if (p.isService) {
        key = '';
      } else {
        key = Object
                .keys(p.element.props.contextSpec.input)
                .map(k => p.context[k])
                .join('__');
      }
      return (
        <WizardItem
          ref={p.id}
          key={p.id + '__' + key}
          actionId={p.id}
          actions={this.props.actions.actions}
          siblingActions={p.isService ? [] : Object.keys(p.prev.actionTree)}
          active={visiblePanels.indexOf(i) !== -1}
          noTheme={p.isService}
          style={{...WizardStyle.item, zIndex: p.isService ? 999 : 1000}}
          onReplace={this.onReplace}
          onFocus={this.onFocus}>
          {cloneWithProps(p.element, {
            ref: p.id,
            context: {...p.context, USER: "'" + __REX_USER__ + "'"},
            wizard: this.state.wizard,
            onContext: this.onContext.bind(null, p.id),
            onClose: this.onClose.bind(null, p.id)
          })}
        </WizardItem>
      );
    });

    var breadcrumb = this.state.wizard.panels.map(p => ({
      id: p.id,
      icon: p.element.props.icon,
      title: Actions.getTitle(p.element)
    }));

    return (
      <VBox style={WizardStyle.self} tabIndex={-1}>
        <VBox ref="items" style={WizardStyle.items}>
          <HBox ref="itemsCanvas" style={{...WizardStyle.itemsCanvas, transform: `translate3d(-${translateX}px, 0, 0)`}}>
            {panels}
          </HBox>
        </VBox>
        <VBox style={WizardStyle.breadcrumb}>
          <Breadcrumb
            active={visiblePanels.map(i => this.state.wizard.panels[i].id)}
            items={breadcrumb}
            onClick={this.onFocus}
            />
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    return {
      wizard: null,
      visiblePanels: [],
      translateX: 0
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.DOMSize !== this.props.DOMSize) {
      var size = nextProps.DOMSize;
      var wizard = this.state.wizard;
      if (wizard === null) {
        wizard = WizardState.construct(this.onWizardUpdate, this.props.actions, size);
      }
      var nextState = {
        ...this.computeCanvasMetrics(wizard, size),
        wizard
      };
      this.setState(nextState);
    }
  },

  onWizardUpdate(wizard) {
    if (wizard === this.state.wizard) {
      return;
    }

    console.log('CONTEXT', wizard.context);
    var onlyFocusUpdate = wizard._panels === this.state.wizard._panels;
    if (onlyFocusUpdate) {
      var metrics = this.computeCanvasMetrics(wizard);
      this.setState({wizard, ...metrics});
    } else {
      var currentFocus = this.state.wizard.focus;
      var targetFocus = wizard.focus;
      var moveRight = targetFocus > currentFocus;

      wizard = wizard.updateFocus(currentFocus);

      while (true) {
        var metrics = this.computeCanvasMetrics(wizard);
        if (metrics.visiblePanels.indexOf(targetFocus) !== -1) {
          this.setState({wizard, ...metrics});
          break;
        } else {
          if (moveRight) {
            wizard = wizard.moveFocusRight();
          } else {
            wizard = wizard.moveFocusLeft();
          }
        }
      }
    }
  },

  computeCanvasMetrics(wizard, size) {
    wizard = wizard || this.state.wizard;
    size = size || this.props.DOMSize;
    return computeCanvasMetrics(wizard, size);
  },

  onReplace(id, replaceId) {
    this.state.wizard
      .close(id)
      .openAfterLast(replaceId)
      .update();
  },

  onContext(id, context) {
    this.state.wizard
      .updateContext(id, context)
      .update();
  },

  onFocus(id) {
    var {panel, idx} = this.state.wizard.find(id);

    if (panel.isService) {
      idx = idx - 1;
    }

    var wizard = this.state.wizard;
    var focus = wizard.focus;

    var left = this.state.visiblePanels[0];
    var right = this.state.visiblePanels[this.state.visiblePanels.length - 1];

    var x = 10
    while (x--) {
      var metrics = this.computeCanvasMetrics(wizard);
      if (metrics.visiblePanels.indexOf(idx) !== -1) {
        break;
      } else if (focus < idx) {
        wizard = wizard.moveFocusRight();
      } else if (focus > idx) {
        wizard = wizard.moveFocusLeft();
      }
    }
    this.setState({
      wizard, ...metrics
    });
  },

  onClose(id) {
    this.state.wizard
      .close(id)
      .update();
  }

});

Wizard = WithDOMSize(Wizard);

module.exports = Wizard;
