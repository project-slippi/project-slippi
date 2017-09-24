// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Container } from 'semantic-ui-react'
import styles from './Home.scss';

export default class Home extends Component {
  generateNav(iconName, header, subHeader, target, disabled) {
    return (
      <Link key={target} to={target}>
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
    let navigationElements = [];

    navigationElements.push(this.generateNav(
      "disk outline",
      "From File System",
      "Play replays from files on your computer",
      "/files",
      false
    ));

    navigationElements.push(this.generateNav(
      "microchip",
      "Stream From Slippi Device",
      "Stream replay from Slippi device",
      "/console",
      true
    ));

    navigationElements.push(this.generateNav(
      "setting",
      "Configure Settings",
      "Configure iso location and replay root",
      "/settings",
      false
    ));

    return (
      <Container text={true} className={styles['vertical-space']}>
        <div className="grid-list">
          <div className="grid-item-center">
           <h2>Home - Navigation Page</h2>
          </div>
          {navigationElements}
        </div>
      </Container>
    );
  }
}
