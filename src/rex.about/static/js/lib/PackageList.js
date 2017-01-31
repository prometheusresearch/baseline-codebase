/**
 * @copyright 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');


var PackageList = React.createClass({
  propTypes: {
    packages: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  render: function () {
    if (!this.props.packages) {
      return (
        <div />
      );
    }

    var cellStyle = {
      style: {
        paddingRight: 20,
        paddingTop: 5,
      }
    };

    var packages = this.props.packages.map((pkg) => {
      var name = pkg.name;
      if (pkg.homepage) {
        name = (
          <a href={pkg.homepage}>{name}</a>
        );
      }

      return (
        <tr key={pkg.name}>
          <td {...cellStyle}>{name}</td>
          <td {...cellStyle}>{pkg.version}</td>
          <td {...cellStyle}>{pkg.license}</td>
          <td {...cellStyle}>{pkg.author}</td>
        </tr>
      );
    });

    return (
      <div
        style={{
          marginTop: '1em',
        }}>
        <table>
          <thead>
            <tr>
              <th {...cellStyle}>Component</th>
              <th {...cellStyle}>Version</th>
              <th {...cellStyle}>License</th>
              <th {...cellStyle}>Author</th>
            </tr>
          </thead>
          <tbody>
            {packages}
          </tbody>
        </table>
      </div>
    );
  }
});


module.exports = PackageList;

