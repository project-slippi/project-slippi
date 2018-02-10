import React, { Component } from 'react';
import { Table, Icon } from 'semantic-ui-react';

import styles from './GameProfile.scss';

import * as moveUtils from '../../utils/moves';
import * as animationUtils from '../../utils/animations';
import * as timeUtils from '../../utils/time';

const columnCount = 5;

export default class StocksTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generateStockRow = (stock) => {
    let start = timeUtils.convertFrameCountToDurationString(stock.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;

    let killedBy = <span className={styles['secondary-text']}>-</span>;
    let killedDirection = <span className={styles['secondary-text']}>-</span>;
    let killedPercent = <span className={styles['secondary-text']}>-</span>;

    const isFirstFrame = stock.startFrame === timeUtils.frames.START_FRAME;
    if (isFirstFrame) {
      start = <span className={styles['secondary-text']}>–</span>;
    }

    if (stock.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(stock.endFrame);

      killedBy = moveUtils.getMoveName(stock.moveKilledBy) || `Unknown (${stock.moveKilledBy})`;
      killedDirection = this.renderKilledDirection(stock);
      killedPercent = `${Math.trunc(stock.endPercent)} %`;
    }

    const secondaryTextStyle = styles['secondary-text'];
    return (
      <Table.Row key={`${stock.playerIndex}-stock-${stock.startFrame}`}>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{start}</Table.Cell>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{end}</Table.Cell>
        <Table.Cell>{killedBy}</Table.Cell>
        <Table.Cell>{killedDirection}</Table.Cell>
        <Table.Cell>{killedPercent}</Table.Cell>
      </Table.Row>
    );
  };

  renderKilledDirection(stock) {
    const killedDirection = animationUtils.getDeathDirection(stock.deathAnimation);
    return <Icon name={`arrow ${killedDirection}`} color="green" inverted={true} />;
  }

  renderHeaderPlayer() {
    // TODO: Make generating the player display better
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={columnCount}>
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
        <Table.HeaderCell>Killed By</Table.HeaderCell>
        <Table.HeaderCell>Killed Direction</Table.HeaderCell>
        <Table.HeaderCell>Killed Percent</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderStocksRows() {
    const stats = this.props.game.getStats() || {};
    const stocks = _.get(stats, ['events', 'stocks']) || [];
    const stocksByPlayer = _.groupBy(stocks, 'playerIndex');
    const playerStocks = stocksByPlayer[this.props.playerIndex] || [];

    return playerStocks.map(this.generateStockRow);
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
          {this.renderStocksRows()}
        </Table.Body>
      </Table>
    );
  }
}
