// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Container } from 'semantic-ui-react'
import styles from './Home.css';

export default class Home extends Component {
  generateNav(iconName, header, subHeader, target, disabled) {
    return (
      <Link to={target}>
        <Button fluid={true} inverted={true} color={"green"} disabled={disabled}>
          <div className="grid-list center-items">
            <Header as='h2' inverted={true} textAlign={"center"}>
              <Icon name={iconName} />
              <Header.Content>
                {header}
                <Header.Subheader>
                  {subHeader}
                </Header.Subheader>
              </Header.Content>
            </Header>
          </div>
        </Button>
      </Link>
    );
  }

  render() {
    let playFromFile = this.generateNav(
      "disk outline",
      "From File System",
      "Play replays from files on your computer",
      "/files",
      false
    );

    let streamFromSlippi = this.generateNav(
      "microchip",
      "Stream From Slippi Device",
      "Stream replay from Slippi device",
      "/",
      true
    );

    return (
      <Container text={true} className={styles['vertical-space']}>
        <div className="grid-list">
          <div className="grid-item-center">
           <h2>Select Replay Type</h2>
          </div>
          {playFromFile}
          {streamFromSlippi}
        </div>
      </Container>
    );
  }
}
