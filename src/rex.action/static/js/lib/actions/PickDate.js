/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var {VBox, HBox}        = RexWidget.Layout;
var Action              = require('../Action');
var {command, Types}    = require('../ActionCommand');

var moment              = require('moment');
var Datepicker          = require('react-bootstrap-datetimepicker/src/DatePicker');
var Day                 = require('react-bootstrap-datetimepicker/src/Day');
var Month               = require('react-bootstrap-datetimepicker/src/Month');

var Style = {
  datepicker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  datepickerPicker: {
    height: '100%'
  },
  datepickerPickerTable: {
    width: '100%',
    height: '100%'
  },
  onActive: {
    cell: {
      backgroundColor: '#3071a9',
      color: '#fff'
    }
  },
  onAnnotated: {
    cell: {
      backgroundColor: 'rgb(255, 221, 221)'
    }
  }
};

var PickDate = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    annotateMonthQuery: RexWidget.DataSpecification.collection({
      year: RexWidget.DataSpecification.computed((_, state) => state.viewDate.year()),
      month: RexWidget.DataSpecification.computed((_, state) => state.viewDate.month() + 1)
    }),
    annotateYearQuery: RexWidget.DataSpecification.collection({
      year: RexWidget.DataSpecification.computed((_, state) => state.viewDate.year())
    })
  },

  fetchDataSpecs: {
    annotateMonthQuery: true,
    annotateYearQuery: true
  },

  render() {
    var {onClose, width} = this.props;
    var title = this.constructor.getTitle(this.props);
    this.__annotateMonthQueryIndex = buildIndex(this.data.annotateMonthQuery.data);
    this.__annotateYearQueryIndex = buildIndex(this.data.annotateYearQuery.data);
    return (
      <Action title={title} onClose={onClose} width={width}>
        <Datepicker
          style={{...Style.datepicker, height: this.props.width}}
          renderDay={this.renderDay}
          renderMonth={this.renderMonth}
          onSelectedDate={this.onSelectedDate}
          pickerStyle={Style.datepickerPicker}
          pickerTableStyle={Style.datepickerPickerTable}
          viewDate={this.state.viewDate}
          onViewDate={this.onViewDate}
          selectedDate={this.getSelectedDate()}
          />
      </Action>
    );
  },

  renderDay(props) {
    let {date} = props;
    var key = props.value.format('YYYY-MM-DD');
    var annotated = this.__annotateMonthQueryIndex[key];
    var title = typeof annotated === 'string' ? annotated : undefined;
    return (
      <Day
        {...props}
        title={title}
        backgroundColor={annotated ? "rgb(255, 221, 221)" : undefined}
        />
    );
  },

  renderMonth(props) {
    var key = `${props.year}-${props.month +1}`;
    var annotated = this.__annotateYearQueryIndex[key];
    var title = typeof annotated === 'string' ? annotated : undefined;
    return (
      <Month
        {...props}
        size={{width: '33%'}}
        title={title}
        backgroundColor={annotated ? "rgb(255, 221, 221)" : undefined}
        />
    );
  },

  getDefaultProps() {
    return {
      icon: 'calendar',
      width: 400
    };
  },

  getInitialState() {
    return {
      viewDate: moment()
    };
  },

  getSelectedDate() {
    if (this.props.context.date) {
      return moment(this.props.context.date);
    } else {
      return moment('0000-00-00');
    }
  },


  onViewDate(viewDate) {
    this.setState({viewDate});
  },

  onSelectedDate(selectedDate) {
    this.props.onCommand('default', selectedDate.format('YYYY-MM-DD'));
  },

  statics: {
    getTitle(props) {
      return props.title || 'Pick date';
    },

    commands: {

      @command(Types.Value())
      default(props, context, date) {
        return {...context, date};
      }
    }
  }
});

function buildIndex(data) {
  if (data && data.hasOwnProperty('__index')) {
    return data.__index;
  }
  if (!data) {
    return {};
  }
  var key = Object.keys(data)[0];
  var rows = data[key];
  var index = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    index[row.date] = row.value;
  }
  data.__index = index;
  return index;
}

module.exports = PickDate;
