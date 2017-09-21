import React, { Component } from 'react';
import { Header, Icon } from 'semantic-ui-react'

export default class PageHeader extends Component {
  props: {
    text: string,
    icon: string
  };

  render() {
    return (
      <Header as='h1' color={"green"} dividing={true}>
        <Icon name={this.props.icon} />
        <Header.Content>
          {this.props.text}
        </Header.Content>
      </Header>
    );
  }
}
