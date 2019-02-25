/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import 'normalize.css';
import './index.css';

import React              from 'react';
import {style}            from 'react-stylesheet';
import DateTimeField      from '../src';

let colors = {
  brand0: 'rgb(1, 60, 154)',
  brand1: 'rgba(1, 60, 154, 0.18)',

  base0: 'rgb(248, 248, 248)',
  base1: 'rgb(255, 255, 255)',

};

function createStylesheet(obj) {
  let stylesheet = {};
  for (let k in obj) {
    if (obj.hasOwnProperty(k)) {
      let {Component = 'div', ...base} = obj[k];
      stylesheet[k] = style(Component, {base});
    }
  }
  return stylesheet;
}

let styled = createStylesheet({

  root: {
    height: '100%',
    backgroundColor: colors.base0,
    overflow: 'hidden',
  },

  pane: {
    width: 600,
    margin: '0 auto',
    padding: '10px 0px',
  },

  content: {
    height: 'calc(100% - 80px)',
    overflow: 'auto',
  },

  header: {
    marginTop: 30,
    marginBottom: 30,
    fontSize: '24pt',
    Component: 'h1',
    fontWeight: 'bold',
    color: colors.brand0,
  },

  footer: {
    boxShadow: '0px 3px 10px rgba(58, 58, 58, 0.39)',
    height: 80,
    backgroundColor: colors.base1,
    position: 'relative',
  },

  footerLine: {
    Component: 'span',
    marginRight: 2,
    fontSize: '80%',
    color: '#999',
    position: 'relative',
    top: 7,
  },

  demo: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: '1px solid #ccc',
    lastChild: {
      borderBottom: 'none',
    }
  },

  code: {
    Component: 'pre',
    borderRadius: 0,
    backgroundColor: '#fefefe',
    border: 'none',
    borderBottom: `1px solid ${colors.brand1}`,
    borderTop: `1px solid ${colors.brand1}`,
    fontSize: '80%',
    color: '#888',
    padding: 10,
    marginBottom: 10
  }
});

export default class Example extends React.Component {

	render() {
    return (
      <styled.root>
        <styled.content>
          <styled.pane>

            <styled.header>React DateTimePicker</styled.header>

            <styled.demo>
              <p>
                Basic usage:   
              </p>
              <styled.code>
{`<DateTimeField />`}
              </styled.code>
              <DateTimeField />
            </styled.demo>

            <styled.demo>
              <p>
                Set placeholder:
              </p>
              <styled.code>
{`<DateTimeField
  defaultText="Please select a date"
  />`}
              </styled.code>
              <DateTimeField
                defaultText="Please select a date"
                />
            </styled.demo>

            <styled.demo>
              <p>
                Custom input format:
              </p>
              <styled.code>
{`<DateTimeField
  inputFormat="DD-MM-YYYY"
  />`}
              </styled.code>
              <DateTimeField
                inputFormat="DD-MM-YYYY"
                />
            </styled.demo>

            <styled.demo>
              <p>
                Time picker mode:
              </p>
              <styled.code>
{`<DateTimeField
  mode="time"
  />`}
              </styled.code>
              <DateTimeField
                  mode="time"
                  />
            </styled.demo>

            <styled.demo>
              <p>
                Date picker mode:
              </p>
              <styled.code>
{`<DateTimeField
  mode="date"
  />`}
              </styled.code>
              <DateTimeField
                  mode="date"
                  />
            </styled.demo>
          </styled.pane>
        </styled.content>
        <styled.footer>
          <styled.pane>
            <styled.footerLine>
              Open Source project by 
            </styled.footerLine>
            <a href="http://prometheusresearch.com">
              <img height={50} src={require('./logo.png')} />
            </a>
          </styled.pane>
        </styled.footer>
      </styled.root>
    );
  }
}
