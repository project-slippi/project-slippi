import React, { Component } from 'react';
import { Image } from 'semantic-ui-react';
import _ from 'lodash';
import classNames from 'classnames';
import * as playerUtils from '../../utils/players';
import getLocalImage from '../../utils/image';
import SpacedGroup from './SpacedGroup';

import styles from './PlayerChiclet.scss';

export default class PlayerChiclet extends Component {
  props: {
    game: object,
    playerIndex: number,
    showContainer: boolean,
  };

  static defaultProps = {
    showContainer: false,
  };

  renderNameChiclet() {
    const game = this.props.game;
    const index = this.props.playerIndex;

    const name = playerUtils.getPlayerName(game, index);

    return (
      <div className={styles['name-display']}>
        {name}
      </div>
    );
  }

  renderCharacterBadge(player) {
    return (
      <Image
        key={`player-character-icon-${player.playerIndex}`}
        className={styles['character-image']}
        src={getLocalImage(`stock-icon-${player.characterId}-${player.characterColor}.png`)}
        inline={true}
        height={18}
        width={18}
      />
    );
  }

  renderPortBadge(player) {
    const dotRadius = 1.7;
    const centerX = 10;
    const centerY = 8;
    const spacer = 2.5;
    const color = "#919296";
    const background = "#2D313A";

    let portCircles = [];
    switch (player.port) {
    case 1:
      portCircles = [
        <circle key="1-1" cx={centerX} cy={centerY} r={dotRadius} fill={color} />,
      ];
      break;
    case 2:
      portCircles = [
        <circle key="2-1" cx={centerX - spacer} cy={centerY} r={dotRadius} fill={color} />,
        <circle key="2-2" cx={centerX + spacer} cy={centerY} r={dotRadius} fill={color} />,
      ];
      break;
    case 3:
      portCircles = [
        <circle key="3-1" cx={centerX} cy={centerY - spacer} r={dotRadius} fill={color} />,
        <circle key="3-2" cx={centerX - spacer} cy={centerY + spacer} r={dotRadius} fill={color} />,
        <circle key="3-3" cx={centerX + spacer} cy={centerY + spacer} r={dotRadius} fill={color} />,
      ];
      break;
    case 4:
      portCircles = [
        <circle key="4-1" cx={centerX - spacer} cy={centerY - spacer} r={dotRadius} fill={color} />,
        <circle key="4-2" cx={centerX + spacer} cy={centerY - spacer} r={dotRadius} fill={color} />,
        <circle key="4-3" cx={centerX - spacer} cy={centerY + spacer} r={dotRadius} fill={color} />,
        <circle key="4-4" cx={centerX + spacer} cy={centerY + spacer} r={dotRadius} fill={color} />,
      ];
      break;
    default:
      // Nothing
      break;
    }

    return (
      <svg width="20px" height="18px">
        <path
          strokeWidth="1px"
          stroke={color}
          d="M3.18,0.9375
            a9,9 0 1,0 13.5,0
            Z"
          fill={background}
        />
        {portCircles}
      </svg>
    );
  }

  render() {
    const settings = this.props.game.getSettings() || {};
    const players = settings.players || {};
    const playersByIndex = _.keyBy(players, 'playerIndex');
    const player = playersByIndex[this.props.playerIndex] || {};

    const containerClasses = classNames({
      [styles['container']]: this.props.showContainer,
    });

    return (
      <div className={containerClasses}>
        <SpacedGroup size="xs">
          {this.renderCharacterBadge(player)}
          {this.renderNameChiclet()}
          {this.renderPortBadge(player)}
        </SpacedGroup>
      </div>
    );
  }
}
