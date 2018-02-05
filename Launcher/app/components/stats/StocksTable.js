import _ from 'lodash';
import React, { Component } from 'react';
import { Table, Button, Image } from 'semantic-ui-react';
import styles from './GameProfile.scss';

export default class StocksTable extends Component {
  props: {
    game: object,
    playerDisplay: object,
    playerIndex: number,
  };

  generateStockRow = (stock) => (
    <Table.Row key={`${stock.playerIndex}-stock-${stock.startFrame}`}>
      <Table.Cell>{stock.startFrame}</Table.Cell>
      <Table.Cell>{stock.endFrame - stock.startFrame}</Table.Cell>
      <Table.Cell>{stock.moveKilledBy} · {stock.deathAnimation} · {stock.endPercent}</Table.Cell>
    </Table.Row>
  );

  renderHeaderPlayer() {
    // TODO: Make generating the player display better
    return (
      <Table.Row>
        <Table.HeaderCell colSpan={3}>
          {this.props.playerDisplay}
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  renderHeaderColumns() {
    return (
      <Table.Row>
        <Table.HeaderCell>Start</Table.HeaderCell>
        <Table.HeaderCell>Duration</Table.HeaderCell>
        <Table.HeaderCell>Death</Table.HeaderCell>
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
