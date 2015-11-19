/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var RexWidget         = require('rex-widget');
var {HBox}            = RexWidget.Layout;
var NavigationButton  = require('./NavigationButton');

var Breadcrumb = React.createClass({

  render() {
    var {locations, styleButton, styleButtonHover, ...props} = this.props;
    locations = locations.map((loc, index) =>
      <NavigationButton
        style={styleButton}
        styleHover={index == locations.length - 1 ?
                    {background: 'inherit'} : styleButtonHover}
        key={loc.url + '_' + loc.title}
        padding={5}
        iconRight={loc.url ? "menu-right":null}
        href={loc.url}>
        {loc.title}
      </NavigationButton>
    );
    return (
      <HBox {...props}>
        {locations}
      </HBox>
    );
  }
});

module.exports = Breadcrumb;
