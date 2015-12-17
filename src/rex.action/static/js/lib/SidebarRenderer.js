/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant from 'invariant';
import ReactDOM from 'react-dom';

export default function SidebarRenderer(Component) {
  return class extends Component {

    static canRenderSidebar = true;

    constructor(props) {
      super(props);
      invariant(
        typeof this.renderSidebar === 'function',
        'Component %s should define renderSidebar() method', this.constructor.name
      );
    }

    _renderSidebar() {
      this._node = this._node || document.getElementById(`${this.props.id}__sidebar`);
      if (this._node) {
        ReactDOM.render(this.renderSidebar(), this._node);
      }
    }

    componentDidMount() {
      if (super.componentDidMount) {
        super.componentDidMount();
      }
      this._renderSidebar();
    }

    componentDidUpdate() {
      if (super.componentDidUpdate) {
        super.componentDidUpdate();
      }
      this._renderSidebar();
    }
  };
}
