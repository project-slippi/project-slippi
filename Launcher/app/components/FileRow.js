import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Image } from 'semantic-ui-react';
import styles from './FileLoader.scss';
import getLocalImage from '../utils/image';
import * as stageUtils from '../utils/stages';
import * as timeUtils from '../utils/time';

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

  generateFileNameCell() {
    const file = this.props.file || {};

    const fileName = file.fileName || "";
    const extension = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, extension);

    return (
      <Table.Cell singleLine={true}>
        {nameWithoutExt}
      </Table.Cell>
    );
  }

  generateTeamElements(settings) {
    // If this is a teams game, group by teamId, otherwise group players individually
    const teams = _.chain(settings.players).groupBy((player) => (
      settings.isTeams ? player.teamId : player.port
    )).toArray().value();

    // This is an ugly way to do this but the idea is to create spaced groups of
    // character icons when those characters are on a team and each team should
    // have an element indicating they are playing against each other in between
    const elements = [];
    teams.forEach((team, idx) => {
      const teamImages = team.map((player) => (
        <Image
          key={`player-port-${player.port}`}
          src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
          inline={true}
          height={24}
          width={24}
        />
      ));

      elements.push(
        <span className="horizontal-spaced-group-right-xs" key={`team-${idx}`}>
          {teamImages}
        </span>
      );

      if (idx < teams.length - 1) {
        // If this is not the last team, add a "vs" element
        elements.push(<span className={styles['vs-element']} key={`vs-${idx}`}> vs </span>);
      }
    });

    return elements;
  }

  generateCharacterCell() {
    const file = this.props.file || {};

    const settings = file.game.getSettings() || {};

    return (
      <Table.Cell singleLine={true}>
        {this.generateTeamElements(settings)}
      </Table.Cell>
    );
  }

  generateStageCell() {
    const file = this.props.file || {};

    const settings = file.game.getSettings() || {};
    const stageId = settings.stageId;
    const stageName = stageUtils.getStageName(stageId) || "Unknown";

    return (
      <Table.Cell singleLine={true}>
        {stageName}
      </Table.Cell>
    );
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
        {this.generateFileNameCell()}
        {this.generateCharacterCell()}
        {this.generateStageCell()}
        {this.generateStartTimeCell()}
        {this.generateOptionsCell()}
      </Table.Row>
    );
  }
}
