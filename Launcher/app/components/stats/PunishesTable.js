import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import { Table, Image } from 'semantic-ui-react';

import styles from './GameProfile.scss';

import getLocalImage from '../../utils/image';
import * as timeUtils from '../../utils/time';

export default class PunishesTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generatePunishRow = (punish) => {
    const start = timeUtils.convertFrameCountToDurationString(punish.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;
    let damage = <span className={styles['secondary-text']}>–</span>;

    if (punish.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(punish.endFrame);
    }

    if (punish.endPercent) {
      const difference = punish.endPercent - punish.startPercent;
      damage = `${Math.trunc(difference)}%`;
    }

    return (
      <Table.Row key={`${punish.playerIndex}-punish-${punish.startFrame}`}>
        <Table.Cell>{start}</Table.Cell>
        <Table.Cell>{end}</Table.Cell>
        <Table.Cell>{damage}</Table.Cell>
        <Table.Cell>{punish.hitCount}</Table.Cell>
      </Table.Row>
    );
  };

  generateStockRow = (stock) => {
    // TODO: Get this from game settings
    const totalStocks = 4;
    const currentStocks = stock.count - 1;

    const gameSettings = this.props.game.getSettings();
    const players = gameSettings.players || [];
    const playersByIndex = _.keyBy(players, 'playerIndex');
    const player = playersByIndex[stock.playerIndex] || {};

    const stockIcons = _.range(1, totalStocks + 1).map((stockNum) => {
      const imgClasses = classNames({
        [styles['lost-stock']]: stockNum > currentStocks
      });

      return (
        <Image
          key={`stock-image-${stock.playerIndex}-${stockNum}`}
          className={imgClasses}
          src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
          height={24}
          width={24}
        />
      );
    });

    const containerClasses = classNames({
      [styles['stock-display']]: true,
      'horizontal-spaced-group-right-xs': true,
    });

    const key = `${stock.playerIndex}-stock-lost-${currentStocks}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['info']} colSpan={4}>
          <div className={containerClasses}>
            {stockIcons}
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  renderHeaderPlayer() {
    // TODO: Make generating the player display better
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={4}>
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
        <Table.HeaderCell>Damage</Table.HeaderCell>
        <Table.HeaderCell>Hit Count</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderPunishRows() {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];
    const punishesByPlayer = _.groupBy(punishes, 'playerIndex');
    const playerPunishes = punishesByPlayer[this.props.playerIndex] || [];

    const stocks = _.get(stats, ['events', 'stocks']) || [];
    const stocksByOpponent = _.groupBy(stocks, 'opponentIndex');
    const opponentStocks = stocksByOpponent[this.props.playerIndex] || [];

    const elements = [];
    playerPunishes.forEach((punish) => {
      // Add stock rows to indicate when the opponent died
      while (opponentStocks[0] && opponentStocks[0].endFrame && opponentStocks[0].endFrame < punish.startFrame) {
        const stock = opponentStocks.shift();
        const stockRow = this.generateStockRow(stock);
        elements.push(stockRow);
      }

      const punishRow = this.generatePunishRow(punish);
      elements.push(punishRow);
    });

    // This loop will add all remaining stocks to the end of all the punishes
    while (opponentStocks[0] && opponentStocks[0].endFrame) {
      const stock = opponentStocks.shift();
      const stockRow = this.generateStockRow(stock);
      elements.push(stockRow);
    }

    return elements;
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
          {this.renderPunishRows()}
        </Table.Body>
      </Table>
    );
  }
}
