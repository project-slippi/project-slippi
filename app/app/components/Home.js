// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Container, Segment } from 'semantic-ui-react'
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
    let upcomingElements = [];

    navigationElements.push(this.generateNav(
      "disk outline",
      "From File System",
      "Play replays from files on your computer",
      "/files",
      false
    ));

    upcomingElements.push(this.generateNav(
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
        <Segment basic={true} className="grid-list">
          <div className="grid-item-center">
           <Header as="h2" color="green">Home - Navigation Page</Header>
          </div>
          {navigationElements}
        </Segment>
        <Segment basic={true} className="grid-list">
          <div className="grid-item-center">
            <Header as="h2" color="green">Upcoming Features</Header>
          </div>
          {upcomingElements}
        </Segment>
      </Container>
    );
  }
}
