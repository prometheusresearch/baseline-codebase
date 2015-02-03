/** @jsx React.DOM */

  var React = require('react');


  var Popup = React.createClass({
    getDefaultProps: function() {
      return {
        t: 200,
        l: 200,
        h: 300,
        w: 600,
        xOffset: 90,
        yOffset: -300,
        init_open: false,
        text: 'Popup',
        closeText: 'Close ',
        className: '',
        style: 'button',
        children: <h2>Hello World</h2>,
      };
    },
    getInitialState: function() {
      return {
        open: false,
        t: 200,
        l: 200,
      };
    },
    componentDidMount: function() {
      var rect = this.refs.btn.getDOMNode().getBoundingClientRect();
      this.setState({t: Math.floor( rect.top ), l: Math.floor( rect.left )});
    },
    handleClick: function(event) {
      this.setState({open: !this.state.open});

      var rect = this.refs.btn.getDOMNode().getBoundingClientRect();
      this.setState({t: Math.floor( rect.top )+this.props.yOffset, l: Math.floor( rect.left )+this.props.xOffset});
      //console.log( Math.floor( rect.top) ,  Math.floor( rect.left) );
    },
    render: function() {
      var text = this.state.open ? this.props.closeText : '';
      var div = this.state.open ? <PopupContent h={this.props.h} w={this.props.w}  t={this.state.t} l={this.state.l} children={this.props.children} close={this.handleClick}/> : '';

      var activate = this.props.style === 'button' ? <button className={this.props.className} onClick={this.handleClick} ref="btn">{text}{this.props.text}</button> : <a className={this.props.className} onClick={this.handleClick} ref="btn">{text}{this.props.text}</a>;

      return ( <div className={'rw-PopupActivate'}>
        {activate}
        {div}
        </div> ); 
    }

  });

  var PopupContent = React.createClass({
    getDefaultProps: function() {
      return {
        t: 300,
        l: 300,
        h: 300,
        w: 400,
      };
    },
    handleClick: function(event) {
      this.props.close();
    },
    render: function() {

      var divStyle = {
        position: 'fixed',
        top: this.props.t+'px',
        left: this.props.l+'px',
        width: this.props.w+'px',
        padding: '10px',
        height: this.props.h+'px',
        zIndex: '99',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e3e3e3',
        borderRadius: '4px',
        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.05) inset',
      };
      
      var btnStyle = {
        float: 'right',
        margin: '10px',
      };
      
      return ( <div className={'rw-Popup resizable'} style={divStyle}><button onClick={this.handleClick} style={btnStyle}>X</button> {this.props.children} </div> ); 
    }

  });

   
  module.exports = Popup;
