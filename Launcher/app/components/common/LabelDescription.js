import React, { Component } from 'react';
import styles from './LabelDescription.scss';

export default class LabelDescription extends Component {
  props: {
    label: string,
    description: string,
  };

  render() {
    return (
      <div>
        <div className={styles['label']}>{this.props.label}</div>
        <div className={styles['description']}>{this.props.description}</div>
      </div>
    );
  }
}
