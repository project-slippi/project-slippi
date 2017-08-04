// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
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
          <a onClick={this.test}>
            <h2>Launch Replay</h2>
          </a>
        </div>
      </div>
    );
  }
}
