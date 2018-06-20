import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import { Table, Image, Icon } from 'semantic-ui-react';

import styles from '../../styles/pages/GameProfile.scss';

import getLocalImage from '../../utils/image';
import * as timeUtils from '../../utils/time';
import * as numberUtils from '../../utils/number';

const columnCount = 6;

export default class PunishesTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generatePunishRow = (punish) => {
    const start = timeUtils.convertFrameCountToDurationString(punish.startFrame);
    let end = <span className={styles['secondary-text']}>–</span>;
    const damage = this.renderDamageCell(punish);
    const damageRange = this.renderDamageRangeCell(punish);
    const openingType = this.renderOpeningTypeCell(punish);

    if (punish.endFrame) {
      end = timeUtils.convertFrameCountToDurationString(punish.endFrame);
    }

    const secondaryTextStyle = styles['secondary-text'];

    return (
      <Table.Row key={`${punish.playerIndex}-punish-${punish.startFrame}`}>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{start}</Table.Cell>
        <Table.Cell className={secondaryTextStyle} collapsing={true}>{end}</Table.Cell>
        <Table.Cell collapsing={true}>{damage}</Table.Cell>
        <Table.Cell className={styles['attach-to-left-cell']}>{damageRange}</Table.Cell>
        <Table.Cell>{punish.moves.length}</Table.Cell>
        <Table.Cell collapsing={true}>{openingType}</Table.Cell>
      </Table.Row>
    );
  };

  generateEmptyRow = (stock) => {
    const player = this.getPlayer(stock.playerIndex);
    const stockIndex = player.startStocks - stock.count + 1;
    return (
      <Table.Row key={`no-punishes-${stock.count}`}>
        <Table.Cell className={styles['secondary-text']} colSpan={columnCount}>
          No punishes on opponent&apos;s {numberUtils.toOrdinal(stockIndex)} stock
        </Table.Cell>
      </Table.Row>
    );
  };

  generateStockRow = (stock) => {
    const player = this.getPlayer(stock.playerIndex);

    const totalStocks = player.startStocks;
    const currentStocks = stock.count - 1;

    const stockIcons = _.range(1, totalStocks + 1).map((stockNum) => {
      const imgClasses = classNames({
        [styles['lost-stock']]: stockNum > currentStocks,
      });

      return (
        <Image
          key={`stock-image-${stock.playerIndex}-${stockNum}`}
          className={imgClasses}
          src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
          height={20}
          width={20}
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
        <Table.Cell className={styles['info']} colSpan={columnCount}>
          <div className={containerClasses}>
            {stockIcons}
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  getPlayer(playerIndex: number) {
    const gameSettings = this.props.game.getSettings();
    const players = gameSettings.players || [];
    const playersByIndex = _.keyBy(players, 'playerIndex');
    return playersByIndex[playerIndex];
  }

  renderDamageCell(punish) {
    const difference = punish.currentPercent - punish.startPercent;

    let heartColor = "green";
    if (difference >= 70) {
      heartColor = "red";
    } else if (difference >= 35) {
      heartColor = "yellow";
    }

    const diffDisplay = `${Math.trunc(difference)}%`;

    return (
      <div className={`${styles['punish-damage-display']} horizontal-spaced-group-right-sm`}>
        <Icon inverted={true} color={heartColor} name="heartbeat" size="large" />
        <div>{diffDisplay}</div>
      </div>
    );
  }

  renderDamageRangeCell(punish) {
    return (
      <div className={styles['secondary-text']}>
        {`(${Math.trunc(punish.startPercent)}% - ${Math.trunc(punish.currentPercent)}%)`}
      </div>
    );
  }

  renderOpeningTypeCell(punish) {
    const textTranslation = {
      'counter-attack': "Counter Hit",
      'neutral-win': "Neutral",
      'trade': "Trade",
    };

    return (
      <div className={styles['secondary-text']}>
        {textTranslation[punish.openingType]}
      </div>
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
        <Table.HeaderCell colSpan={2}>Damage</Table.HeaderCell>
        <Table.HeaderCell>Moves</Table.HeaderCell>
        <Table.HeaderCell>Opening</Table.HeaderCell>
      </Table.Row>
    );
  }

  renderPunishRows() {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, 'conversions') || [];
    const punishesByPlayer = _.groupBy(punishes, 'playerIndex');
    const playerPunishes = punishesByPlayer[this.props.playerIndex] || [];

    const stocks = _.get(stats, 'stocks') || [];
    const stocksByOpponent = _.groupBy(stocks, 'opponentIndex');
    const opponentStocks = stocksByOpponent[this.props.playerIndex] || [];

    const elements = [];

    const addStockRows = (punish) => {
      const shouldDisplayStockLoss = () => {
        // Calculates whether we should display a stock loss row in this position
        const currentStock = _.first(opponentStocks);
        const currentStockWasLost = currentStock && currentStock.endFrame;
        const wasLostBeforeNextPunish = !punish || currentStock.endFrame < punish.startFrame;

        return currentStockWasLost && wasLostBeforeNextPunish;
      };

      let addedStockRow = false;

      // stockLossAdded is used to decide whether to display a empty state row if
      // there were no punishes for an entire stock (opponent SD'd immediately)
      // Is normally initialized false and will only trigger if two stock rows are
      // rendered one after another. but will initialize to true if we are considering
      // the very first punish, this is the handle the case where someone SD's on first
      // stock
      let shouldAddEmptyState = punish === _.first(playerPunishes);
      while (shouldDisplayStockLoss()) {
        const stock = opponentStocks.shift();

        if (shouldAddEmptyState) {
          const emptyPunishes = this.generateEmptyRow(stock);
          elements.push(emptyPunishes);
        }

        const stockRow = this.generateStockRow(stock);
        elements.push(stockRow);

        addedStockRow = true;

        // If we show two stock loss rows back to back, add an empty state in between
        shouldAddEmptyState = true;
      }

      // Special case handling when a player finishes their opponent without getting hit
      // on their last stock. Still want to show an empty state
      const stock = _.first(opponentStocks);
      if (stock && addedStockRow && !punish) {
        const emptyPunishes = this.generateEmptyRow(stock);
        elements.push(emptyPunishes);
      }
    };

    playerPunishes.forEach((punish) => {
      // Add stock rows to indicate when the opponent died
      addStockRows(punish);

      const punishRow = this.generatePunishRow(punish);
      elements.push(punishRow);
    });

    // This loop will add all remaining stocks to the end of all the punishes
    addStockRows();

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
