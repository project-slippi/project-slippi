import React, { Component } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { Header, Segment, Statistic, Sticky, Image, Icon } from 'semantic-ui-react';
import PageHeader from './common/PageHeader';
import styles from './GameProfile.scss';
import getLocalImage from '../utils/image';

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

  renderComparisonStat(label, type, unit, highlightWhen, renderer) {
    // TODO: Maybe move this to a component
    const value1 = renderer(0);
    const value2 = renderer(1);

    const elementToHighlight = this.getElementToHighlight(value1, value2, highlightWhen);

    const propsBase = {
      label: label,
      inverted: true
    };

    const props1 = {
      ...propsBase,
      value: `${this.getDisplayValue(value1, type, unit)}`,
      color: elementToHighlight === 1 ? "yellow" : null
    };

    const props2 = {
      ...propsBase,
      value: `${this.getDisplayValue(value2, type, unit)}`,
      color: elementToHighlight === 2 ? "yellow" : null
    };

    return (
      <Statistic.Group size="small" widths="two">
        <Statistic {...props1} />
        <Statistic {...props2} />
      </Statistic.Group>
    );
  }

  getElementToHighlight(value1, value2, highlightWhen) {
    // Determine which element to highlight
    let elementToHighlight = null;
    switch (highlightWhen) {
    case 'greater':
      if (value1 > value2) {
        elementToHighlight = 1;
      } else if (value2 > value1) {
        elementToHighlight = 2;
      }
      break;
    case 'lower':
      if (value1 < value2) {
        elementToHighlight = 1;
      } else if (value2 < value1) {
        elementToHighlight = 2;
      }
      break;
    default:
      // Keep element to highlight null
      break;
    }

    return elementToHighlight;
  }

  getDisplayValue(value, type, unit) {
    let convertedValue = null;

    switch (type) {
    case 'float':
      convertedValue = value.toFixed(1);
      break;
    default:
      convertedValue = value;
      break;
    }

    const unitDisplay = unit || "";
    return `${convertedValue}${unitDisplay}`;
  }

  renderPlayerCol(index) {
    const gameSettings = _.get(this.props.store, ['game', 'settings']) || {};
    const players = gameSettings.players || [];
    const player = (index === 0 ? _.first(players) : _.last(players)) || {};

    return (
      <Segment
        className={styles['player-col']}
        textAlign="center"
        basic={true}
      >
        <Header inverted={true} textAlign="center" as="h2">
          <Image
            className={styles['character-image']}
            src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
          />
          Player {player.port}
        </Header>
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
            {this.renderPlayerCol(0)}
            {this.renderPlayerCol(1)}
          </div>
        </Sticky>
        <div ref={this.setRefStats} className={statsSectionClasses}>
          {this.renderOffenseHighlights()}
          {this.renderDefenseHighlights()}
          {this.renderNeutralHighlights()}
        </div>
      </Segment>
    );
  }

  renderOffenseHighlights() {
    return (
      <Segment basic={true}>
        <Header inverted={true} textAlign="center" as="h2">
          Offense Highlights
        </Header>
        <div className="grid-list">
          {this.renderComparisonStat("Average Punish Damage", "float", "%", "greater", (index) => (
            index === 0 ? 13.2 : 15.5
          ))}
          {this.renderComparisonStat("Openings / Kill", "float", null, "lower", (index) => (
            index === 0 ? 2.1 : 7
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 14 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 24 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 14 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 24 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 14 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 24 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 14 : 18
          ))}
          {this.renderComparisonStat("Punishes Started", "int", null, null, (index) => (
            index === 0 ? 24 : 18
          ))}
        </div>
      </Segment>
    );
  }

  renderDefenseHighlights() {
    return (
      <Segment basic={true}>
        <Header inverted={true} textAlign="center" as="h2">
          Defense Highlights
        </Header>
      </Segment>
    );
  }

  renderNeutralHighlights() {
    return (
      <Segment basic={true}>
        <Header inverted={true} textAlign="center" as="h2">
          Neutral Highlights
        </Header>
      </Segment>
    );
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
