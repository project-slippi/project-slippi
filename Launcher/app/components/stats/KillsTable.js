import _ from 'lodash';
import React, { Component } from 'react';
import { Table, Icon } from 'semantic-ui-react';

import styles from '../../styles/pages/GameProfile.scss';

import * as moveUtils from '../../utils/moves';
import * as animationUtils from '../../utils/animations';
import * as timeUtils from '../../utils/time';

const columnCount = 5;

export default class KillsTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generateStockRow = (stock) => {
    let start = timeUtils.convertFrameCountToDurationString(stock.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;

    let killedBy = <span className={styles['secondary-text']}>–</span>;
    let killedDirection = <span className={styles['secondary-text']}>–</span>;

    const percent = `${Math.trunc(stock.currentPercent)}%`;

    const isFirstFrame = stock.startFrame === timeUtils.frames.START_FRAME;
    if (isFirstFrame) {
      start = <span className={styles['secondary-text']}>–</span>;
    }

    if (stock.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(stock.endFrame);

      killedBy = this.renderKilledBy(stock);
      killedDirection = this.renderKilledDirection(stock);
    }

    const secondaryTextStyle = styles['secondary-text'];
    return (
      <Table.Row key={`${stock.playerIndex}-stock-${stock.startFrame}`}>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{start}</Table.Cell>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{end}</Table.Cell>
        <Table.Cell>{killedBy}</Table.Cell>
        <Table.Cell>{killedDirection}</Table.Cell>
        <Table.Cell>{percent}</Table.Cell>
      </Table.Row>
    );
  };

  renderKilledBy(stock) {
    // Here we are going to grab the opponent's punishes and see if one of them was
    // responsible for ending this stock, if so show the kill move, otherwise assume SD
    const stats = this.props.game.getStats();
    const punishes = _.get(stats, 'conversions') || [];
    const punishesByPlayer = _.groupBy(punishes, 'playerIndex');
    const playerPunishes = punishesByPlayer[this.props.playerIndex] || [];

    // Only get punishes that killed
    const killingPunishes = _.filter(playerPunishes, 'didKill');
    const killingPunishesByEndFrame = _.keyBy(killingPunishes, 'endFrame');
    const punishThatEndedStock = killingPunishesByEndFrame[stock.endFrame];

    if (!punishThatEndedStock) {
      return <span className={styles['secondary-text']}>Self Destruct</span>;
    }

    const lastMove = _.last(punishThatEndedStock.moves);
    return moveUtils.getMoveName(lastMove.moveId);
  }

  renderKilledDirection(stock) {
    const killedDirection = animationUtils.getDeathDirection(stock.deathAnimation);

    return (
      <Icon
        name={`arrow ${killedDirection}`}
        color="green"
        inverted={true}
      />
    );
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
        <Table.HeaderCell>Kill Move</Table.HeaderCell>
        <Table.HeaderCell>Direction</Table.HeaderCell>
        <Table.HeaderCell>Percent</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderStocksRows() {
    const stats = this.props.game.getStats() || {};
    const stocks = _.get(stats, 'stocks') || [];
    const stocksByOpponent = _.groupBy(stocks, 'opponentIndex');
    const opponentStocks = stocksByOpponent[this.props.playerIndex] || [];

    return opponentStocks.map(this.generateStockRow);
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
