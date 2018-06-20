import _ from 'lodash';
import React, { Component } from 'react';
import { Table } from 'semantic-ui-react';
import classNames from 'classnames';

import styles from '../../styles/pages/GameProfile.scss';

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

  renderMultiStatField(header, arrPath, fieldPaths, valueMapper, highlight) {
    const stats = this.props.game.getStats() || {};
    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = _.keyBy(arr, 'playerIndex');

    const player1Item = itemsByPlayer[this.props.player1Index] || {};
    const player2Item = itemsByPlayer[this.props.player2Index] || {};

    const generateValues = (item) => (
      _.chain(item)
        .pick(fieldPaths)
        .toArray()
        .map((v) => (valueMapper ? valueMapper(v) : v))
        .value()
    );

    const displayRenderer = (firstPlayer) => {
      const item = firstPlayer ? player1Item : player2Item;
      const oppItem = firstPlayer ? player2Item : player1Item;

      const values = generateValues(item);
      const oppValues = generateValues(oppItem);

      const classes = classNames({
        [styles['highlight-text']]: highlight && highlight(values, oppValues),
      });

      return (
        <div className={classes}>
          {values.join(' / ')}
        </div>
      );
    };

    const key = `standard-field-${header}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>
          {header}
        </Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderRatioStatField(header, arrPath, fieldPath, ratioRenderer) {
    const stats = this.props.game.getStats() || {};
    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = _.keyBy(arr, 'playerIndex');

    const player1Item = itemsByPlayer[this.props.player1Index] || {};
    const player2Item = itemsByPlayer[this.props.player2Index] || {};

    const displayRenderer = (firstPlayer) => {
      const item = firstPlayer ? player1Item : player2Item;
      const oppItem = firstPlayer ? player2Item : player1Item;

      const ratio = _.get(item, fieldPath);
      const oppRatio = _.get(oppItem, fieldPath);

      return ratioRenderer(ratio, oppRatio);
    };

    const key = `standard-field-${header.toLowerCase()}`;
    return (
      <Table.Row key={key}>
        <Table.Cell className={styles['sub-header']}>
          {header}
        </Table.Cell>
        <Table.Cell>{displayRenderer(true)}</Table.Cell>
        <Table.Cell>{displayRenderer(false)}</Table.Cell>
      </Table.Row>
    );
  }

  renderSimpleRatioField(header, arrPath, fieldPath, highlightCondition) {
    return this.renderRatioStatField(header, arrPath, fieldPath, (ratio, oppRatio) => {
      const playerRatio = _.get(ratio, 'ratio');
      if (playerRatio === null) {
        return <div className={styles['secondary-text']}>N/A</div>;
      }

      const oppRatioField = _.get(oppRatio, 'ratio');

      const fixedPlayerRatio = playerRatio !== null ? playerRatio.toFixed(1) : null;
      const fixedOppRatio = oppRatioField !== null ? oppRatioField.toFixed(1) : null;

      const classes = classNames({
        [styles['highlight-text']]: highlightCondition(fixedPlayerRatio, fixedOppRatio),
      });

      return (
        <div className={classes}>
          {fixedPlayerRatio}
        </div>
      );
    });
  }

  renderCountPercentField(header, arrPath, fieldPath, highlightCondition) {
    return this.renderRatioStatField(header, arrPath, fieldPath, (ratio, oppRatio) => {
      const playerCount = _.get(ratio, 'count') || 0;
      const playerRatio = _.get(ratio, 'ratio');

      const oppCount = _.get(oppRatio, 'count') || 0;

      const classes = classNames({
        [styles['highlight-text']]: highlightCondition(playerCount, oppCount),
      });

      let secondaryDisplay = null;
      if (playerRatio !== null) {
        secondaryDisplay = (
          <div className={styles['secondary-text']}>
            ({numberUtils.formatPercent(playerRatio, 0)})
          </div>
        );
      }

      return (
        <div className={styles['stat-with-sub-value']}>
          <div className={classes}>{playerCount}</div>
          {secondaryDisplay}
        </div>
      );
    });
  }

  renderPercentFractionField(header, arrPath, fieldPath, highlightCondition) {
    return this.renderRatioStatField(header, arrPath, fieldPath, (ratio, oppRatio) => {
      const playerRatio = _.get(ratio, 'ratio');
      if (playerRatio === null) {
        return <div className={styles['secondary-text']}>N/A</div>;
      }

      const oppRatioField = _.get(oppRatio, 'ratio');

      const fixedPlayerRatio = playerRatio !== null ? playerRatio.toFixed(3) : null;
      const fixedOppRatio = oppRatioField !== null ? oppRatioField.toFixed(3) : null;

      const classes = classNames({
        [styles['highlight-text']]: highlightCondition(fixedPlayerRatio, fixedOppRatio),
      });

      const playerCount = _.get(ratio, 'count');
      const playerTotal = _.get(ratio, 'total');

      return (
        <div className={styles['stat-with-sub-value']}>
          <div className={classes}>{numberUtils.formatPercent(playerRatio, 1)}</div>
          <div className={styles['secondary-text']}>
            ({playerCount} / {playerTotal})
          </div>
        </div>
      );
    });
  }

  renderOpeningField(header, field) {
    return this.renderCountPercentField(header, "overall", field, (playerCount, oppCount) => (
      playerCount > oppCount
    ));
  }

  renderHigherSimpleRatioField(header, field) {
    return this.renderSimpleRatioField(
      header, "overall", field, (fixedPlayerRatio, fixedOppRatio) => {
        const oppIsNull = fixedPlayerRatio && fixedOppRatio === null;
        const isHigher = fixedPlayerRatio > fixedOppRatio;
        return oppIsNull || isHigher;
      }
    );
  }

  renderLowerSimpleRatioField(header, field) {
    return this.renderSimpleRatioField(
      header, "overall", field, (fixedPlayerRatio, fixedOppRatio) => {
        const oppIsNull = fixedPlayerRatio && fixedOppRatio === null;
        const isLower = fixedPlayerRatio < fixedOppRatio;
        return oppIsNull || isLower;
      }
    );
  }

  renderHigherPercentFractionField(header, field) {
    return this.renderPercentFractionField(
      header, "overall", field, (fixedPlayerRatio, fixedOppRatio) => {
        const oppIsNull = fixedPlayerRatio && fixedOppRatio === null;
        const isHigher = fixedPlayerRatio > fixedOppRatio;
        return oppIsNull || isHigher;
      }
    );
  }

  renderOffenseSection() {
    return [
      <Table.Row key="offense-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Offense</Table.Cell>
      </Table.Row>,
      this.renderMultiStatField(
        "Kills", "overall", "killCount", null, (v, ov) => v[0] > ov[0]
      ),
      this.renderMultiStatField(
        "Damage Done", "overall", "totalDamage",
        v => v.toFixed(1),
        (v, ov) => parseInt(v[0], 10) > parseInt(ov[0], 10)
      ),
      this.renderHigherPercentFractionField(
        "Opening Conversion Rate", "successfulConversions"
      ),
      this.renderLowerSimpleRatioField("Openings / Kill", "openingsPerKill"),
      this.renderHigherSimpleRatioField("Damage / Opening", "damagePerOpening"),
    ];
  }

  renderDefenseSection() {
    return [
      <Table.Row key="defense-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Defense</Table.Cell>
      </Table.Row>,
      this.renderMultiStatField(
        "Actions (Roll / Air Dodge / Spot Dodge)", ['actionCounts'],
        ['rollCount', 'airDodgeCount', 'spotDodgeCount']
      ),
    ];
  }

  renderNeutralSection() {
    return [
      <Table.Row key="neutral-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>Neutral</Table.Cell>
      </Table.Row>,
      this.renderOpeningField("Neutral Wins", "neutralWinRatio"),
      this.renderOpeningField("Counter Hits", "counterHitRatio"),
      this.renderOpeningField("Beneficial Trades", "beneficialTradeRatio"),
      this.renderMultiStatField(
        "Actions (Wavedash / Waveland / Dash Dance)", ['actionCounts'],
        ['wavedashCount', 'wavelandCount', 'dashDanceCount']
      ),
    ];
  }

  renderGeneralSection() {
    return [
      <Table.Row key="general-header">
        <Table.Cell className={styles['category']} colSpan={columnCount}>General</Table.Cell>
      </Table.Row>,
      this.renderHigherSimpleRatioField("Inputs / Minute", "inputsPerMinute"),
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
          {this.renderGeneralSection()}
        </Table.Body>
      </Table>
    );
  }
}
