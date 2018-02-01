import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import './Titlebar.less';

/**
 * Class representating the titlebar. Usually used in a panel.
 *
 * @class The TitleBar
 * @extends React.Component
 */
export class Titlebar extends React.Component {

  /**
   * The className added to this component.
   * @type {String}
   * @private
   */
  className = 'react-geo-titlebar'

  /**
   * The properties.
   * @type {Object}
   */
  static propTypes = {
    /**
     * The className which should be added.
     * @type {String}
     */
    className: PropTypes.string,
    /**
     * The children to show in the Window.
     * @type {node}
     */
    children: PropTypes.node,
    /**
     * The dispatch function.
      @type {Function}
     */
    dispatch: PropTypes.func,
    /**
     * Additional elements to show at the right side of the Titlebar.
     * @type {Array<object>}
     */
    tools: PropTypes.arrayOf(PropTypes.element)
  }

  /**
   * The render function.
   */
  render() {
    const {
      className,
      tools,
      children,
      ...passThroughProps
    } = this.props;

    const finalClassName = className
      ? `${className} ${this.className}`
      : this.className;

    return (
      <div className={finalClassName} {...passThroughProps} >
        <span className="title">
          {children}
        </span>
        {
          !isEmpty(tools) ?
            <span className="controls">
              {tools}
            </span> :
            null
        }
      </div>
    );
  }
}

export default Titlebar;
