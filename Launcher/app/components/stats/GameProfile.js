import React, { Component } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { Header, Segment, Table, Sticky, Image, Icon } from 'semantic-ui-react';

import PageHeader from '../common/PageHeader';
import StocksTable from './StocksTable';
import PunishesTable from './PunishesTable';

import styles from './GameProfile.scss';

import getLocalImage from '../../utils/image';
import * as stageUtils from '../../utils/stages';
import * as timeUtils from '../../utils/time';

export default class GameProfile extends Component {
  props: {
    history: object,
    store: object
  };

  refStats: {};

  state = {
    isStatsStuck: false
  };

  setRefStats = element => {
    this.refStats = element;
  };

  renderContent() {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    if (players.length !== 2) {
      return this.renderEmpty();
    }

    return this.renderStats();
  }

  renderEmpty() {
    return (
      <Header color="green" inverted={true} as="h1" textAlign="center" icon={true}>
        <Icon name="hand peace" />
        Only Singles is Supported
      </Header>
    );
  }

  renderMatchupDisplay() {
    return (
      <div className={styles['matchup-display']}>
        {this.renderPlayerDisplay(0)}
        <span className={styles['vs-element']}>vs</span>
        {this.renderPlayerDisplay(1)}
      </div>
    );
  }

  renderPlayerDisplay(index) {
    const isFirstPlayer = index === 0;

    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};

    const segmentClasses = classNames({
      [styles['player-display']]: true,
      [styles['second']]: !isFirstPlayer,
      'horizontal-spaced-group-right-sm': isFirstPlayer,
      'horizontal-spaced-group-left-sm': !isFirstPlayer,
    });

    return (
      <Segment
        className={segmentClasses}
        textAlign="center"
        basic={true}
      >
        <Header inverted={true} textAlign="center" as="h2">
          Player {player.port}
        </Header>
        <Image
          className={styles['character-image']}
          src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
        />
      </Segment>
    );
  }

  renderGameDetails() {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const stageName = stageUtils.getStageName(gameSettings.stageId) || "Unknown";

    const duration = _.get(this.props.store, ['game', 'stats', 'gameDuration']) || 0;
    const durationDisplay = timeUtils.convertFrameCountToDurationString(duration);

    const platform = _.get(this.props.store, ['game', 'metadata', 'playedOn']) || "Unknown";

    const startAt = _.get(this.props.store, ['game', 'metadata', 'startAt']);
    const startAtDisplay = timeUtils.convertToDateAndTime(startAt);

    const gameDetailsClasses = classNames({
      [styles['game-details']]: true
    });

    const metadata = [
      {
        label: "Stage",
        content: stageName
      }, {
        label: "Duration",
        content: durationDisplay
      }, {
        label: "Time",
        content: startAtDisplay
      }, {
        label: "Platform",
        content: platform
      }
    ];

    const metadataElements = metadata.map((details) => (
      <div key={details.label}>
        <span className={styles['label']}>{details.label}</span>
        &nbsp;
        <span className={styles['content']}>{details.content}</span>
      </div>
    ));

    return (
      <Segment
        className={gameDetailsClasses}
        textAlign="center"
        basic={true}
      >
        {metadataElements}
      </Segment>
    );
  }

  renderStats() {
    const handleStick = () => {
      this.setState({
        isStatsStuck: true
      });
    };

    const handleUnstick = () => {
      this.setState({
        isStatsStuck: false
      });
    };

    const statsSectionClasses = classNames({
      [styles['stuck']]: this.state.isStatsStuck
    }, styles['stats-section']);

    return (
      <Segment basic={true}>
        <Sticky
          className={styles['sticky-names']}
          onStick={handleStick}
          onUnstick={handleUnstick}
          context={this.refStats}
        >
          <div className={styles['stats-player-header']}>
            {this.renderMatchupDisplay()}
            {this.renderGameDetails()}
          </div>
        </Sticky>
        <div ref={this.setRefStats} className={statsSectionClasses}>
          {this.renderHighlights()}
          {this.renderStocks()}
          {this.renderPunishes()}
        </div>
      </Segment>
    );
  }

  renderHighlights() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Overall
        </Header>
        <Table
          className={styles['stats-table']}
          celled={true}
          inverted={true}
          selectable={true}
        >
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>{this.renderPlayerColHeader(true)}</Table.HeaderCell>
              <Table.HeaderCell>{this.renderPlayerColHeader(false)}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            <Table.Row>
              <Table.Cell className={styles['category']} colSpan={3}>Offense</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Openings / Kill</Table.Cell>
              <Table.Cell>4.5</Table.Cell>
              <Table.Cell>5.6</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Damage / Opening</Table.Cell>
              <Table.Cell>12.3</Table.Cell>
              <Table.Cell>10.9</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['category']} colSpan={3}>Defense</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Recovery Ratio</Table.Cell>
              <Table.Cell>5 / 10</Table.Cell>
              <Table.Cell>8 / 8</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Counter-Attack Count</Table.Cell>
              <Table.Cell>4</Table.Cell>
              <Table.Cell>0</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['category']} colSpan={3}>Neutral</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Neutral Win %</Table.Cell>
              <Table.Cell>42.4%</Table.Cell>
              <Table.Cell>57.6%</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className={styles['sub-header']}>Center Stage Control</Table.Cell>
              <Table.Cell>60.0%</Table.Cell>
              <Table.Cell>40.0%</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
    );
  }

  renderPlayerColHeader(isFirstPlayer = true) {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};

    const rootDivClasses = classNames({
      [styles['player-col-header']]: true,
      'horizontal-spaced-group-right-xs': true,
    });

    return (
      <div className={rootDivClasses}>
        <Image
          src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
          height={24}
          width={24}
        />
        <div>
          Player {player.port}
        </div>
      </div>
    );
  }

  renderStocks() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Stocks
        </Header>
        <div className={styles['two-column-main']}>
          <StocksTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(true)}
            playerIndex={this.getPlayerIndex(true)}
          />
          <StocksTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(false)}
            playerIndex={this.getPlayerIndex(false)}
          />
        </div>
      </Segment>
    );
  }

  renderPunishes() {
    return (
      <Segment basic={true}>
        <Header className={styles['section-header']} inverted={true} as="h2">
          Punishes
        </Header>
        <div className={styles['two-column-main']}>
          <PunishesTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(true)}
            playerIndex={this.getPlayerIndex(true)}
          />
          <PunishesTable
            game={this.props.store.game}
            playerDisplay={this.renderPlayerColHeader(false)}
            playerIndex={this.getPlayerIndex(false)}
          />
        </div>
      </Segment>
    );
  }

  getPlayerIndex(isFirstPlayer = true) {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};
    return player.playerIndex;
  }

  render() {
    return (
      <div className="main-padding">
        <PageHeader icon="game" text="Game" history={this.props.history} />
        {this.renderContent()}
      </div>
    );
  }
}
