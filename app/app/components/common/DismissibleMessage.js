import React, { Component } from 'react';
import { Message, Transition } from 'semantic-ui-react'

export default class DismissibleMessage extends Component {
  props: {
    visible: bool,
    error: bool,
    icon: string,
    header: string,
    content: string,
    onDismiss: () => void,
    dismissParams: array
  };

  dismiss = () => {
    // This will take the dismiss params and pass them to the onDismiss function
    const dismissParams = this.props.dismissParams || [];
    this.props.onDismiss(...dismissParams);
  };

  render() {
    // Renders a message with a fade transition
    // Ideally I wouldn't have to add the extra div but the styling gets messed up without it
    return (
      <Transition visible={this.props.visible} animation='fade' duration={100}>
        <div>
          <Message
            error={this.props.error}
            icon={this.props.icon}
            header={this.props.header}
            content={this.props.content}
            onDismiss={this.dismiss}
          />
        </div>
      </Transition>
    );
  }
}
