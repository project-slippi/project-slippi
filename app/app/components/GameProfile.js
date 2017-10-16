import React, { Component } from 'react';
import { Header, Container, Input, Segment, Button } from 'semantic-ui-react'
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput'

export default class GameProfile extends Component {
  props: {
    history: object,
    store: object
  };

  renderContent() {
    return <div>Hello</div>;
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
