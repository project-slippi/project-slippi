import React, { Component } from 'react';
import { Header, Icon, Button } from 'semantic-ui-react'

export default class PageHeader extends Component {
  props: {
    text: string,
    icon: string,
    history: object
  };

  handleBack = () => {
    this.props.history.goBack();
  };

  render() {
    return (
      <Header as='h1' color={"green"} dividing={true}>
        <Icon name={this.props.icon} />
        <Header.Content className="full-width">
          <div className="flex-horizontal-split">
            {this.props.text}
            <Button
              content='Back'
              circular={true}
              color="green"
              basic={true}
              inverted={true}
              onClick={this.handleBack}
            />
          </div>
        </Header.Content>
      </Header>
    );
  }
}
