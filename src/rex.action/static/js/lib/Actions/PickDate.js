/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var {VBox, HBox}        = RexWidget.Layout;

var moment              = require('moment');
var Datepicker          = require('react-bootstrap-datetimepicker/src/DateTimePickerDate');

var PickDateStyle = {
  self: {
    flex: 1,
  },
  title: {
    flex: 1
  },
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
  },
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
  }
};

var PickDate = React.createClass({

  render() {
    var {onClose} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...PickDateStyle.self, width: this.props.width}}>
        <HBox style={PickDateStyle.header}>
          <VBox style={PickDateStyle.title}>
            <h4>{title}</h4>
          </VBox>
          <RexWidget.Button
            quiet
            icon="remove"
            onClick={onClose}
            />
        </HBox>
        <VBox style={PickDateStyle.content}>
          <Datepicker
            style={{...PickDateStyle.datepicker, height: this.props.width}}
            pickerStyle={PickDateStyle.datepickerPicker}
            pickerTableStyle={PickDateStyle.datepickerPickerTable}
            viewDate={this.state.viewDate}
            selectedDate={this.state.selectedDate}
            setViewMonth={this.setViewMonth}
            setViewYear={this.setViewYear}
            addMonth={this.addMonth}
            addYear={this.addYear}
            addDecade={this.addDecade}
            subtractMonth={this.subtractMonth}
            subtractYear={this.subtractYear}
            subtractDecade={this.subtractDecade}
            setSelectedDate={this.setSelectedDate}
            />
        </VBox>
      </VBox>
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
      viewDate: moment(),
      selectedDate: moment()
    };
  },

  setViewMonth(month) {
    return this.setState({
      viewDate: this.state.viewDate.clone().month(month)
    });
  },

  setViewYear(year) {
    return this.setState({
      viewDate: this.state.viewDate.clone().year(year)
    });
  },

  addMonth() {
    return this.setState({
      viewDate: this.state.viewDate.add(1, "months")
    });
  },

  addYear() {
    return this.setState({
      viewDate: this.state.viewDate.add(1, "years")
    });
  },

  addDecade() {
    return this.setState({
      viewDate: this.state.viewDate.add(10, "years")
    });
  },

  subtractMonth() {
    return this.setState({
      viewDate: this.state.viewDate.subtract(1, "months")
    });
  },

  subtractYear() {
    return this.setState({
      viewDate: this.state.viewDate.subtract(1, "years")
    });
  },

  subtractDecade() {
    return this.setState({
      viewDate: this.state.viewDate.subtract(10, "years")
    });
  },

  setSelectedDate(e) {
    var target = e.target;
    if (target.className && !target.className.match(/disabled/g)) {
      var month;
      if(target.className.indexOf("new") >= 0) month = this.state.viewDate.month() + 1;
      else if(target.className.indexOf("old") >= 0) month = this.state.viewDate.month() - 1;
      else month = this.state.viewDate.month();
      var date = this.state.viewDate
        .clone()
        .month(month)
        .date(parseInt(e.target.innerHTML))
        .hour(this.state.selectedDate.hours())
        .minute(this.state.selectedDate.minutes());
      this.setState({
        selectedDate: date.clone(),
        viewDate: date.clone()
      });
      this.props.onContext({date: date.format('YYYY-MM-DD')});
    }
  },

  statics: {
    getTitle(props) {
      return props.title || 'Pick date';
    }
  }
});

module.exports = PickDate;
