import _ from 'lodash';
import React, { Component } from 'react';
import { Table } from 'semantic-ui-react';

import styles from './GameProfile.scss';

import * as timeUtils from '../../utils/time';

export default class EdgeguardsTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generateEdgeguardRow = (edgeguard) => {
    const start = timeUtils.convertFrameCountToDurationString(edgeguard.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;

    if (edgeguard.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(edgeguard.endFrame);
    }

    return (
      <Table.Row key={`${edgeguard.playerIndex}-edgeguard-${edgeguard.startFrame}`}>
        <Table.Cell>{start}</Table.Cell>
        <Table.Cell>{end}</Table.Cell>
      </Table.Row>
    );
  };

  renderHeaderPlayer() {
    // TODO: Make generating the player display better
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={2}>
          {this.props.playerDisplay}
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell>Start</Table.HeaderCell>
        <Table.HeaderCell>End</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderEdgeguardRows() {
    const stats = this.props.game.getStats() || {};
    const edgeguards = _.get(stats, ['events', 'edgeguards']) || [];
    const edgeguardsByPlayer = _.groupBy(edgeguards, 'playerIndex');
    const playerEdgeguards = edgeguardsByPlayer[this.props.playerIndex] || [];

    return playerEdgeguards.map(this.generateEdgeguardRow);
  }

  render() {
    return (
      <Table
        className={styles['stats-table']}
        celled={true}
        inverted={true}
        selectable={true}
      >
        <Table.Header>
          {this.renderHeaderPlayer()}
          {this.renderHeaderColumns()}
        </Table.Header>

        <Table.Body>
          {this.renderEdgeguardRows()}
        </Table.Body>
      </Table>
    );
  }
}
