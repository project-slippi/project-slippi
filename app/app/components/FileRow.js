const path = require('path');

import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react'
import styles from './FileLoader.scss';
import * as stageUtils from '../utils/stages';
import * as characterUtils from '../utils/characters';

export default class FileRow extends Component {
  props: {
    file: object,
    playFile: (file) => void
  };

  playFile = () => {
    const file = this.props.file || {};

    // Play the file
    this.props.playFile(file);
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
    )
  }

  generateCharacterCell() {
    const file = this.props.file || {};

    const gameInfo = file.gameInfo || {};
    const characterIds = gameInfo.characterIds || [];

    // Get character names from character IDs
    const characterShortNames = characterIds.filter(function (characterId) {
      return characterId === 0 || characterId;
    }).map(function (characterId) {
      return characterUtils.getCharacterShortName(characterId);
    });

    const characterString = characterShortNames.join(' / ');

    return (
      <Table.Cell singleLine={true}>
        {characterString}
      </Table.Cell>
    )
  }

  generateStageCell() {
    const file = this.props.file || {};

    const gameInfo = file.gameInfo || {};
    const stageId = gameInfo.stageId;
    const stageName = stageUtils.getStageName(stageId) || "Unknown";

    return (
      <Table.Cell singleLine={true}>
        {stageName}
      </Table.Cell>
    )
  }

  generateGameLengthCell() {
    const file = this.props.file || {};

    const gameInfo = file.gameInfo || {};
    const duration = gameInfo.duration || "Unknown";

    return (
      <Table.Cell singleLine={true}>
        {duration}
      </Table.Cell>
    )
  }

  render() {
    return (
      <Table.Row>
        {this.generatePlayCell()}
        {this.generateFileNameCell()}
        {this.generateCharacterCell()}
        {this.generateStageCell()}
        {this.generateGameLengthCell()}
      </Table.Row>
    );
  }
}
