/**
 * @copyright 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react/addons');


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

    var packages = this.props.packages.map((pkg) => {
      var name = pkg.name;
      if (pkg.homepage) {
        name = (
          <a href={pkg.homepage}>{name}</a>
        );
      }

      return (
        <tr key={pkg.name}>
          <td>{name}</td>
          <td>{pkg.version}</td>
          <td>{pkg.license}</td>
          <td>{pkg.author}</td>
        </tr>
      );
    });

    return (
      <div className="package-list">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Version</th>
              <th>License</th>
              <th>Author</th>
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

