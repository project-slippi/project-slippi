// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Container } from 'semantic-ui-react'
import styles from './Home.css';
import { exec } from 'child_process';

export default class Home extends Component {
  test() {
    const dolphinPath = "D:\\Users\\Fizzi\\Documents\\Github\\Ishiiruka\\Binary\\x64";
    const meleeFile = "C:\\Dolphin\\Games\\ssbm-v1_02.iso";
    const command = `D: & cd \"${dolphinPath}\" & Dolphin.exe /b /e \"${meleeFile}\"`;
    console.log(command);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
  }

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

    let counterPage = this.generateNav(
      "microchip",
      "Temporary Test Link",
      "This should get removed",
      "/counter",
      false
    );

    return (
      <Container text={true} className={styles['vertical-space']}>
        <div className="grid-list">
          <div className="grid-item-center">
           <h2>Select Replay Type</h2>
          </div>
          {playFromFile}
          {streamFromSlippi}
          {counterPage}
        </div>
      </Container>
    );
  }
}
