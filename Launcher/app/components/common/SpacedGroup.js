import React, { Component } from 'react';
import classNames from 'classnames';
import styles from './SpacedGroup.scss';

export default class SpacedGroup extends Component {
  props: {
    children: any,
    className: string,
    size: string,
    direction: string,
  };

  static defaultProps = {
    className: "",
    size: "sm",
    direction: "horizontal",
  };

  render() {
    const classes = classNames({
      [styles['container']]: true,
      [styles[this.props.size]]: true,
      [styles[this.props.direction]]: true,
    }, this.props.className);

    return (
      <div className={classes}>
        {this.props.children}
      </div>
    );
  }
}
