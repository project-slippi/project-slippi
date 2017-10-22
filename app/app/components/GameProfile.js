import React, { Component } from 'react';
import { Header, Icon, Container, Input, Segment, Button } from 'semantic-ui-react'
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput'

export default class GameProfile extends Component {
  props: {
    history: object,
    store: object
  };

  renderContent() {
    return (
      <Header color="green" inverted="true" as="h1" textAlign="center" icon={true}>
        <Icon name="hand peace" />
        Coming Soon...
      </Header>
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
