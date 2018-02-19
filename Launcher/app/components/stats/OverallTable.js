import React, { Component } from 'react';
import { Table } from 'semantic-ui-react';
import classNames from 'classnames';

import styles from './GameProfile.scss';

import * as numberUtils from '../../utils/number';
import * as moveUtils from '../../utils/moves';

const columnCount = 3;

export default class OverallTable extends Component {
  props: {
    game: object,
    player1Display: object,
    player1Index: number,
    player2Display: object,
    player2Index: number,
  };

  getPunishCountComparisonRenderer(condition) {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];

    const neutralWinPunishes = _.filter(punishes, condition);
    const neutralWinPunishesByPlayer = _.groupBy(neutralWinPunishes, 'playerIndex');

    const player1Punishes = neutralWinPunishesByPlayer[this.props.player1Index] || [];
    const player2Punishes = neutralWinPunishesByPlayer[this.props.player2Index] || [];

    const totalCount = neutralWinPunishes.length;
    return (firstPlayer) => {
      const count = firstPlayer ? player1Punishes.length : player2Punishes.length;
      const oppCount = firstPlayer ? player2Punishes.length : player1Punishes.length;
      const ratio = totalCount ? count / totalCount : 0;

      const countClasses = classNames({
        [styles['highlight-text']]: count > oppCount,
      });

      return (
        <div className={styles['stat-with-sub-value']}>
          <div className={countClasses}>{count}</div>
          <div className={styles['secondary-text']}>
            ({numberUtils.formatPercent(ratio, 0)})
          </div>
        </div>
      );
    };
  }

  renderNeutralWinsRow() {
    const displayRenderer = this.getPunishCountComparisonRenderer((punish) => (
      punish.openingType === "neutral-win"
    ));

    return (
      <Table.Row key="neutral-neutral-wins">
        <Table.Cell className={styles['sub-header']}>Neutral Wins</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderCounterAttackWinsRow() {
    const displayRenderer = this.getPunishCountComparisonRenderer((punish) => (
      punish.openingType === "counter-attack"
    ));

    return (
      <Table.Row key="defense-counter-attacks">
        <Table.Cell className={styles['sub-header']}>Counter Attacks</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderOpeningsPerKillRow() {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];
    const stocks = _.get(stats, ['events', 'stocks']) || [];
    const finishedStocks = _.filter(stocks, 'endFrame');

    const punishesByPlayer = _.groupBy(punishes, 'playerIndex');
    const stocksByPlayer = _.groupBy(finishedStocks, 'playerIndex');

    const player1Punishes = punishesByPlayer[this.props.player1Index] || [];
    const player2Punishes = punishesByPlayer[this.props.player2Index] || [];

    const player1Stocks = stocksByPlayer[this.props.player1Index] || [];
    const player2Stocks = stocksByPlayer[this.props.player2Index] || [];

    const p1Stat = player2Stocks.length ? player1Punishes.length / player2Stocks.length : null;
    const p2Stat = player1Stocks.length ? player2Punishes.length / player1Stocks.length : null;

    const displayRenderer = (firstPlayer) => {
      const stat = firstPlayer ? p1Stat : p2Stat;
      const oppStat = firstPlayer ? p2Stat : p1Stat;

      const classes = classNames({
        [styles['highlight-text']]: stat !== null && (oppStat === null || stat < oppStat),
        [styles['secondary-text']]: stat === null,
      });

      return (
        <div className={classes}>
          {stat === null ? "N/A" : stat.toFixed(1)}
        </div>
      );
    };

    return (
      <Table.Row key="offense-openings-per-kill">
        <Table.Cell className={styles['sub-header']}>Openings / Kill</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderDamagePerOpeningRow() {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];

    const punishesByPlayer = _.groupBy(punishes, 'playerIndex');

    const player1Punishes = punishesByPlayer[this.props.player1Index] || [];
    const player2Punishes = punishesByPlayer[this.props.player2Index] || [];

    const getAverage = (playerPunishes) => {
      if (!playerPunishes.length) {
        return null;
      }

      return _.meanBy(playerPunishes, (punish) => (
        punish.currentPercent - punish.startPercent
      ));
    };

    const p1Stat = getAverage(player1Punishes);
    const p2Stat = getAverage(player2Punishes);

    const displayRenderer = (firstPlayer) => {
      const stat = firstPlayer ? p1Stat : p2Stat;
      const oppStat = firstPlayer ? p2Stat : p1Stat;

      const classes = classNames({
        [styles['highlight-text']]: stat !== null && (oppStat === null || stat > oppStat),
        [styles['secondary-text']]: stat === null,
      });

      return (
        <div className={classes}>
          {stat === null ? "N/A" : stat.toFixed(1)}
        </div>
      );
    };

    return (
      <Table.Row key="offense-damage-per-opening">
        <Table.Cell className={styles['sub-header']}>Damage / Opening</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderStandardStatField(header, arrPath, fieldPath) {
    const stats = this.props.game.getStats() || {};
    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = _.groupBy(arr, 'playerIndex');

    const player1Items = itemsByPlayer[this.props.player1Index] || [];
    const player2Items = itemsByPlayer[this.props.player2Index] || [];

    const player1Item = _.first(player1Items) || {};
    const player2Item = _.first(player2Items) || {};

    const displayRenderer = (firstPlayer) => {
      const item = firstPlayer ? player1Item : player2Item;
      const value = _.get(item, fieldPath);
      return (
        <div className={styles['secondary-text']}>
          {value}
        </div>
      );
    };

    const key = `standard-field-${header.toLowerCase()}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>{header}</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderOffenseSection() {
    return [
      <Table.Row key="offense-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Offense</Table.Cell>
      </Table.Row>,
      this.renderOpeningsPerKillRow(),
      this.renderDamagePerOpeningRow(),
    ];
  }

  renderDefenseSection() {
    return [
      <Table.Row key="defense-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Defense</Table.Cell>
      </Table.Row>,
      this.renderCounterAttackWinsRow(),
      this.renderStandardStatField("Roll Count", ['actionCounts'], ['rollCount']),
      this.renderStandardStatField("Air Dodge Count", ['actionCounts'], ['airDodgeCount']),
      this.renderStandardStatField("Spot Dodge Count", ['actionCounts'], ['spotDodgeCount']),
    ];
  }

  renderNeutralSection() {
    return [
      <Table.Row key="neutral-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Neutral</Table.Cell>
      </Table.Row>,
      this.renderNeutralWinsRow(),
      this.renderStandardStatField("Wavedash Count", ['actionCounts'], ['wavedashCount']),
      this.renderStandardStatField("Waveland Count", ['actionCounts'], ['wavelandCount']),
      this.renderStandardStatField("Dash Dance Count", ['actionCounts'], ['dashDanceCount']),
    ];
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
          <Table.Row>
            <Table.HeaderCell />
            <Table.HeaderCell>{this.props.player1Display}</Table.HeaderCell>
            <Table.HeaderCell>{this.props.player2Display}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {this.renderOffenseSection()}
          {this.renderDefenseSection()}
          {this.renderNeutralSection()}
        </Table.Body>
      </Table>
    );
  }
}
