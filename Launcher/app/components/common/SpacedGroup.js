import React, { Component } from 'react';
import classNames from 'classnames';
import styles from './SpacedGroup.scss';

export default class SpacedGroup extends Component {
  props: {
    childen: any,
    className: string,
    size: string,
  };

  static defaultProps = {
    className: "",
    size: "sm",
  };

  render() {
    const size = this.props.size;

    const classes = classNames({
      [styles['container']]: true,
      [styles[this.props.size]]: true,
    }, this.props.className);

    return (
      <div className={classes}>
        {this.props.children}
      </div>
    );
  }
}
