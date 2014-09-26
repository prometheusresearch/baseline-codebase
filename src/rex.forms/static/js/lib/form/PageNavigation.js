/**
 * @jsx React.DOM
 * */
'use strict';

var React = require('react');

var _                   = require('../localization')._;
var NavigationButton    = require('./NavigationButton');
var PageNavigationMixin = require('./PageNavigationMixin');

var PageNavigation = React.createClass({
  mixins: [PageNavigationMixin],

  propTypes: {
    percentComplete: React.PropTypes.number
  },

  render: function () {
    var around = this.pagesAround();
    var enabledAround = this.enabledPagesAround();
    return (
      <div className="rex-forms-PageNavigation">
        <div className="row">
          <div className="col-sm-5 rex-forms-PageNavigation__prev">
            {around.prev ?
              <NavigationButton
                disabled={!enabledAround.prev}
                onClick={this.prevPage}
                label={_('Previous Page')} /> : null}
          </div>
          <div className="col-sm-2 rex-forms-PageNavigation__info">
            {this.props.children}
          </div>
          <div className="col-sm-5 rex-forms-PageNavigation__next">
            {around.next && !enabledAround.next &&
              <div className="rex-forms-PageNavigation__errors">
                {_('Please address all required questions and errors on this page in order to continue.')}
              </div>
            }
            {around.next &&
              <NavigationButton
                disabled={!enabledAround.next}
                onClick={this.nextPage}
                label={_('Next Page')}
              />
            }
          </div>
        </div>
      </div>
    );
  }
});

module.exports = PageNavigation;
