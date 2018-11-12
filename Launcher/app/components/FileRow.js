import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Image } from 'semantic-ui-react';
import styles from './FileLoader.scss';
import SpacedGroup from './common/SpacedGroup';
import PlayerChiclet from './common/PlayerChiclet';
import * as stageUtils from '../utils/stages';
import * as timeUtils from '../utils/time';
import * as playerUtils from '../utils/players';

const path = require('path');

export default class FileRow extends Component {
  props: {
    file: object,
    playFile: (file) => void,
    gameProfileLoad: (game) => void,
  };

  playFile = () => {
    const file = this.props.file || {};

    // Play the file
    this.props.playFile(file);
  };

  viewStats = () => {
    const file = this.props.file || {};
    const fileGame = file.game;

    this.props.gameProfileLoad(fileGame);
  };

  generatePlayCell() {
    return (
      <Table.Cell className={styles['play-cell']} textAlign="center">
        <Button
          circular={true}
          inverted={true}
          size="tiny"
          basic={true}
          icon="play"
          onClick={this.playFile}
        />
      </Table.Cell>
    );
  }

  generateDetailsCell() {
    const metadata = [
      {
        label: "Stage",
        content: this.getStageName(),
      }, {
        separator: true,
      }, {
        label: "File",
        content: this.getFileName(),
      },
    ];

    const metadataDisplay = _.map(metadata, (entry, key) => {
      if (entry.separator) {
        return <div key={`separator-${key}`} className={styles["separator"]}>|</div>;
      }

      return (
        <div key={`metadata-${entry.label}`}>
          <span className={styles["label"]}>{entry.label}</span>
          <span className={styles["value"]}>{entry.content}</span>
        </div>
      );
    });

    return (
      <Table.Cell singleLine={true}>
        <SpacedGroup>
          {this.generateTeamElements()}
        </SpacedGroup>
        <SpacedGroup className={styles['metadata-display']} size="md"> 
          {metadataDisplay}
        </SpacedGroup>
      </Table.Cell>
    );
  }

  getFileName() {
    const file = this.props.file || {};

    const fileName = file.fileName || "";
    const extension = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, extension);

    return nameWithoutExt;
  }

  getStageName() {
    const file = this.props.file || {};

    const settings = file.game.getSettings() || {};
    const stageId = settings.stageId;
    const stageName = stageUtils.getStageName(stageId) || "Unknown";

    return stageName;
  }

  generateTeamElements() {
    const file = this.props.file || {};
    const game = file.game || {};
    const settings = game.getSettings() || {};

    // If this is a teams game, group by teamId, otherwise group players individually
    const teams = _.chain(settings.players).groupBy((player) => (
      settings.isTeams ? player.teamId : player.port
    )).toArray().value();

    // This is an ugly way to do this but the idea is to create spaced groups of
    // character icons when those characters are on a team and each team should
    // have an element indicating they are playing against each other in between
    const elements = [];
    teams.forEach((team, idx) => {
      // Add player chiclets for all the players on the team
      team.forEach((player) => {
        elements.push((
          <PlayerChiclet
            key={`player-${player.playerIndex}`}
            game={game}
            playerIndex={player.playerIndex}
            showContainer={true}
          />
        ));
      });
      
      // Add VS obj in between teams
      if (idx < teams.length - 1) {
        // If this is not the last team, add a "vs" element
        elements.push(<div className={styles['vs-element']} key={`vs-${idx}`}> vs </div>);
      }
    });

    return elements;
  }

  generateStartTimeCell() {
    const file = this.props.file || {};

    const metadata = file.game.getMetadata() || {};
    const startAt = metadata.startAt;
    const startAtDisplay = timeUtils.convertToDateAndTime(startAt) || "Unknown";

    return (
      <Table.Cell singleLine={true}>
        {startAtDisplay}
      </Table.Cell>
    );
  }

  generateOptionsCell() {
    return (
      <Table.Cell className={styles['play-cell']} textAlign="center">
        <Link to="/game" replace={false}>
          <Button
            circular={true}
            inverted={true}
            size="tiny"
            basic={true}
            icon="bar chart"
            onClick={this.viewStats}
          />
        </Link>
      </Table.Cell>
    );
  }

  render() {
    return (
      <Table.Row>
        {this.generatePlayCell()}
        {this.generateDetailsCell()}
        {this.generateStartTimeCell()}
        {this.generateOptionsCell()}
      </Table.Row>
    );
  }
}
