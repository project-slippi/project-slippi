// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react'
import styles from './Home.css';

export default class Home extends Component {
  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <h2>Home</h2>
          <Link to="/counter">to Counter</Link>
          <div>
            <Button inverted={true} color={'green'}>
              This is a test button
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
