// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Grid } from 'semantic-ui-react'
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

  generateNav(iconName, header, subHeader, disabled) {
    return (
      <div>
        <Button fluid={true} inverted={true} color={"green"} disabled={disabled}>
          <Grid centered={true} columns={1}>
            <Grid.Column>
              <Header as='h2' inverted={true} color={"green"} textAlign={"center"}>
                <Icon name={iconName} />
                <Header.Content>
                  {header}
                  <Header.Subheader>
                    {subHeader}
                  </Header.Subheader>
                </Header.Content>
              </Header>
            </Grid.Column>
          </Grid>
        </Button>
      </div>
    );
  }

  render() {
    let playFromFile = this.generateNav(
      "disk outline",
      "From File System",
      "Play replays from files on your computer",
      false
    );

    let streamFromSlippi = this.generateNav(
      "microchip",
      "Stream From Slippi Device",
      "Stream replay from Slippi device",
      true
    );

    return (
      <div>
        <div className={styles.container} data-tid="container">
          <Button inverted={true} color={"green"} onClick={this.test}>
            Launch Replay
          </Button>
          {playFromFile}
          {streamFromSlippi}
        </div>
      </div>
    );
  }
}
