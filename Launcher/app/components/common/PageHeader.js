import React, { Component } from 'react';
import { Header, Icon, Button } from 'semantic-ui-react';

export default class PageHeader extends Component {
  props: {
    text: string,
    icon: string,
    history: object,
  };

  handleBack = () => {
    // TODO: This is an ultra hack because on the windows production build
    // TODO: pressing back from the game screen goes all the way back to the
    // TODO: main navigation screen. This... prevents that
    const isWindows = process.platform === "win32";
    const isProd = process.env.NODE_ENV === "production";
    if (this.props.text === "Game" && isWindows && isProd) {
      this.props.history.replace("/files");
      return;
    }

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
