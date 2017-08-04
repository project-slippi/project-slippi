// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react'
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

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <Button inverted={true} color={"green"} onClick={this.test}>
            Launch Replay
          </Button>
        </div>
      </div>
    );
  }
}
