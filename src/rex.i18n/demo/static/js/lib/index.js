/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';
import ReactDOM from 'react-dom';
import DateTime from 'react-datetime';

import {
  Provider, InjectI18N, inject,
  FormatNumber, FormatDecimal, FormatPercent, FormatCurrency,
  FormatDate, FormatTime, FormatDateTime
} from 'rex-i18n';


class LocaleSelector extends React.Component {
  onChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event.target.value);
    }
  }

  render() {
    let options = this.props.locales.map((locale) => {
      return (
        <option key={locale[0]} value={locale[0]}>{locale[1]}</option>
      );
    });

    return (
      <select value={this.props.locale} onChange={this.onChange.bind(this)}>
        {options}
      </select>
    );
  }
}


@InjectI18N
class StringDemoOutput extends React.Component {
  render() {
    let _ = this.getI18N().gettext;
    let ngettext = this.getI18N().ngettext;

    let gt = this.getI18N().gettext('Variable gettext');
    let agt = _('Variable Aliased gettext');
    let ngt = this.getI18N().ngettext('Variable ngettext Single', 'Variable ngettext Plural', this.props.count);
    let angt = ngettext('Variable Aliased ngettext Single', 'Variable Aliased ngettext Plural', this.props.count);

    return (
      <div>
        <p>{this.getI18N().gettext('Inline gettext')}</p>
        <p>{_('Inline Aliased gettext')}</p>
        <p>{this.getI18N().ngettext('Inline ngettext Single', 'Inline ngettext Plural', this.props.count)}</p>
        <p>{ngettext('Inline Aliased ngettext Single', 'Inline Aliased ngettext Plural', this.props.count)}</p>
        <p>{gt}</p>
        <p>{agt}</p>
        <p>{ngt}</p>
        <p>{angt}</p>
        <p>{_('You entered: %(param)s, %(numParam)n', {param: this.props.param, numParam: this.props.numParam})}</p>
      </div>
    );
  }
}


let FunctionalStringDemoOutput = inject(function(props) {
  return (
    <div>
      <p>{this._('Functional Inline gettext')}</p>
      <p>{this.getI18N().ngettext('Functional Inline ngettext Single', 'Functional Inline ngettext Plural', props.count)}</p>
      <p>{this._('You entered: %(param)s, %(numParam)n', {param: props.param, numParam: props.numParam})}</p>
    </div>
  );
});


class StringDemo extends React.Component {
  constructor(props) {
    super(props);
    let i = this.props.initialIndex || 0;
    this.state = {
      locale: this.props.locales[i][0]
    };
  }

  onLocaleChange(locale) {
    this.setState({locale});
  }

  render() {
    return (
      <Provider locale={this.state.locale}>
        <div className='rid-StringDemo'>
          <LocaleSelector
            locale={this.state.locale}
            locales={this.props.locales}
            onChange={this.onLocaleChange.bind(this)}
            />
          <StringDemoOutput
            count={this.props.count}
            param={this.props.param}
            numParam={this.props.numParam}
            />
          <FunctionalStringDemoOutput
            count={this.props.count}
            param={this.props.param}
            numParam={this.props.numParam}
            />
        </div>
      </Provider>
    );
  }
}


class DateDemo extends React.Component {
  constructor(props) {
    super(props);
    let i = this.props.initialIndex || 0;
    this.state = {
      locale: this.props.locales[i][0]
    };
  }

  onLocaleChange(locale) {
    this.setState({locale});
  }

  render() {
    return (
      <Provider locale={this.state.locale}>
        <div className='rid-DateDemo'>
          <LocaleSelector
            locale={this.state.locale}
            locales={this.props.locales}
            onChange={this.onLocaleChange.bind(this)}
            />
          <p>FormatDate(short): <FormatDate value={this.props.date} format='short' /></p>
          <p>FormatDate(medium): <FormatDate value={this.props.date} format='medium' /></p>
          <p>FormatDate(long): <FormatDate value={this.props.date} format='long' /></p>
          <p>FormatDate(full): <FormatDate value={this.props.date} format='full' /></p>
          <p>FormatTime(short): <FormatTime value={this.props.date} format='short' /></p>
          <p>FormatTime(medium): <FormatTime value={this.props.date} format='medium' /></p>
          <p>FormatTime(long): <FormatTime value={this.props.date} format='long' /></p>
          <p>FormatTime(full): <FormatTime value={this.props.date} format='full' /></p>
          <p>FormatDateTime(short): <FormatDateTime value={this.props.date} format='short' /></p>
          <p>FormatDateTime(medium): <FormatDateTime value={this.props.date} format='medium' /></p>
          <p>FormatDateTime(long): <FormatDateTime value={this.props.date} format='long' /></p>
          <p>FormatDateTime(full): <FormatDateTime value={this.props.date} format='full' /></p>
        </div>
      </Provider>
    );
  }
}


class NumberDemo extends React.Component {
  constructor(props) {
    super(props);
    let i = this.props.initialIndex || 0;
    this.state = {
      locale: this.props.locales[i][0]
    };
  }

  onLocaleChange(locale) {
    this.setState({locale});
  }

  render() {
    return (
      <Provider locale={this.state.locale}>
        <div className='rid-NumberDemo'>
          <LocaleSelector
            locale={this.state.locale}
            locales={this.props.locales}
            onChange={this.onLocaleChange.bind(this)}
            />
          <p>FormatNumber: <FormatNumber value={this.props.number} /></p>
          <p>FormatDecimal: <FormatDecimal value={this.props.number} /></p>
          <p>FormatPercent: <FormatPercent value={this.props.number} /></p>
          <p>FormatCurrency: <FormatCurrency value={this.props.number} currency={this.props.currency} /></p>
        </div>
      </Provider>
    );
  }
}


class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: 123456.789,
      currency: 'USD',
      date: new Date(),
      count: 1,
      param: 'foo',
      numParam: '123456.789',
    };
  }

  onNumberChange(variable, event) {
    this.setState({
      [variable]: Number(event.target.value)
    });
  }

  onValueChange(variable, event) {
    this.setState({
      [variable]: event.target.value
    });
  }

  onDateChange(moment) {
    if (moment.toDate) {
      this.setState({
        date: moment.toDate()
      });
    }
  }

  render() {
    return (
      <div className='rid-Demo'>
        <div className='rid-Demo__input'>
          <span>Number Formatting:</span>
          <input
            type='number'
            value={this.state.number}
            onChange={this.onNumberChange.bind(this, 'number')}
            step="0.001"
            />
          <select
            value={this.state.currency}
            onChange={this.onValueChange.bind(this, 'currency')}>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
            <option value='GBP'>GBP</option>
          </select>
        </div>
        <div className='rid-Demo__output'>
          <NumberDemo
            locales={this.props.locales}
            number={this.state.number}
            currency={this.state.currency}
            />
          <NumberDemo
            locales={this.props.locales}
            initialIndex={1}
            number={this.state.number}
            currency={this.state.currency}
            />
          <NumberDemo
            locales={this.props.locales}
            initialIndex={2}
            number={this.state.number}
            currency={this.state.currency}
            />
        </div>

        <div className='rid-Demo__input'>
          <span>Date/Time Formatting:</span>
          <DateTime
            value={this.state.date}
            onChange={this.onDateChange.bind(this)}
            timeFormat='HH:mm:ss'
            />
        </div>
        <div className='rid-Demo__output'>
          <DateDemo
            locales={this.props.locales}
            date={this.state.date}
            />
          <DateDemo
            locales={this.props.locales}
            initialIndex={1}
            date={this.state.date}
            />
          <DateDemo
            locales={this.props.locales}
            initialIndex={2}
            date={this.state.date}
            />
        </div>

        <div className='rid-Demo__input'>
          <span>String Translations:</span>
          <input
            type='number'
            value={this.state.count}
            onChange={this.onNumberChange.bind(this, 'count')}
            />
          <input
            type='text'
            value={this.state.param}
            onChange={this.onValueChange.bind(this, 'param')}
            />
          <input
            type='text'
            value={this.state.numParam}
            onChange={this.onValueChange.bind(this, 'numParam')}
            />
        </div>
        <div className='rid-Demo__output'>
          <StringDemo
            locales={this.props.locales}
            count={this.state.count}
            param={this.state.param}
            numParam={this.state.numParam}
            />
          <StringDemo
            locales={this.props.locales}
            initialIndex={1}
            count={this.state.count}
            param={this.state.param}
            numParam={this.state.numParam}
            />
          <StringDemo
            locales={this.props.locales}
            initialIndex={2}
            count={this.state.count}
            param={this.state.param}
            numParam={this.state.numParam}
            />
        </div>
      </div>
    );
  }
}


function renderDemo(props, element) {
  ReactDOM.render(<Demo {...props} />, element);
}


global.RexI18NDemo = module.exports = {
  renderDemo
};

