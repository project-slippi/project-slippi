import _ from 'lodash';
import React, { Component } from 'react';
import { Table } from 'semantic-ui-react';
import classNames from 'classnames';

import styles from './GameProfile.scss';

import * as numberUtils from '../../utils/number';

const columnCount = 3;

export default class OverallTable extends Component {
  props: {
    game: object,
    player1Display: object,
    player1Index: number,
    player2Display: object,
    player2Index: number,
  };

  getPunishCountComparisonRenderer(player1Punishes, player2Punishes, totalCount) {
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

  getSimplePunishCountComparisonRenderer(condition) {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];

    const openingPunishes = _.filter(punishes, condition);
    const openingPunishesByPlayer = _.groupBy(openingPunishes, 'playerIndex');

    const player1Punishes = openingPunishesByPlayer[this.props.player1Index] || [];
    const player2Punishes = openingPunishesByPlayer[this.props.player2Index] || [];

    const totalCount = openingPunishes.length;

    return this.getPunishCountComparisonRenderer(
      player1Punishes, player2Punishes, totalCount
    );
  }

  renderNeutralWinsRow() {
    const displayRenderer = this.getSimplePunishCountComparisonRenderer((punish) => (
      punish.openingType === "neutral-win"
    ));

    return (
      <Table.Row key="neutral-wins">
        <Table.Cell className={styles['sub-header']}>Neutral Wins</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderReversalsRow() {
    const displayRenderer = this.getSimplePunishCountComparisonRenderer((punish) => (
      punish.openingType === "counter-attack"
    ));

    return (
      <Table.Row key="reversals">
        <Table.Cell className={styles['sub-header']}>Reversals</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderBeneficialTradesRow() {
    const stats = this.props.game.getStats() || {};
    const punishes = _.get(stats, ['events', 'punishes']) || [];

    const tradePunishes = _.filter(punishes, (punish) => (
      punish.openingType === "trade"
    ));
    const tradePunishesByPlayer = _.groupBy(tradePunishes, 'playerIndex');

    const player1Punishes = tradePunishesByPlayer[this.props.player1Index] || [];
    const player2Punishes = tradePunishesByPlayer[this.props.player2Index] || [];

    const benefitsPlayer1 = [];
    const benefitsPlayer2 = [];

    // Figure out who the trades benefited
    const zippedPunishes = _.zip(player1Punishes, player2Punishes);
    zippedPunishes.forEach((punishPair) => {
      const player1Punish = _.first(punishPair);
      const player2Punish = _.last(punishPair);
      const player1Damage = player1Punish.currentPercent - player1Punish.startPercent;
      const player2Damage = player2Punish.currentPercent - player2Punish.startPercent;

      if (player1Punish.didKill && !player2Punish.didKill) {
        benefitsPlayer1.push(player1Punish);
      } else if (player2Punish.didKill && !player1Punish.didKill) {
        benefitsPlayer2.push(player2Punish);
      } else if (player1Damage > player2Damage) {
        benefitsPlayer1.push(player1Punish);
      } else if (player2Damage > player1Damage) {
        benefitsPlayer2.push(player2Punish);
      }
    });

    const displayRenderer = this.getPunishCountComparisonRenderer(
      benefitsPlayer1, benefitsPlayer2, player1Punishes.length
    );

    return (
      <Table.Row key="beneficial-trades">
        <Table.Cell className={styles['sub-header']}>Beneficial Trades</Table.Cell>
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
      <Table.Row key="openings-per-kill">
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
      <Table.Row key="damage-per-opening">
        <Table.Cell className={styles['sub-header']}>Damage / Opening</Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderStandardStatField(header, subHeader, arrPath, fieldPaths) {
    const stats = this.props.game.getStats() || {};
    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = _.groupBy(arr, 'playerIndex');

    const player1Items = itemsByPlayer[this.props.player1Index] || [];
    const player2Items = itemsByPlayer[this.props.player2Index] || [];

    const player1Item = _.first(player1Items) || {};
    const player2Item = _.first(player2Items) || {};

    const displayRenderer = (firstPlayer) => {
      const item = firstPlayer ? player1Item : player2Item;
      const display = _.chain(item).pick(fieldPaths).toArray().join(' / ').value();
      return (
        <div>
          {display}
        </div>
      );
    };

    const key = `standard-field-${header.toLowerCase()}-${subHeader.toLowerCase()}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>
          {header} <span className={"secondary-text"}>{subHeader}</span>
        </Table.Cell>
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
      this.renderStandardStatField(
        "Actions", "(Roll / Air Dodge / Spot Dodge)", ['actionCounts'],
        ['rollCount', 'airDodgeCount', 'spotDodgeCount']
      ),
    ];
  }

  renderNeutralSection() {
    return [
      <Table.Row key="neutral-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Neutral</Table.Cell>
      </Table.Row>,
      this.renderNeutralWinsRow(),
      this.renderReversalsRow(),
      this.renderBeneficialTradesRow(),
      this.renderStandardStatField(
        "Actions", "(Wavedash / Waveland / Dash Dance)", ['actionCounts'],
        ['wavedashCount', 'wavelandCount', 'dashDanceCount']
      ),
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
