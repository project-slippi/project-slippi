import React, { Component } from 'react';
import { Message, Transition } from 'semantic-ui-react';

export default class DismissibleMessage extends Component {
  props: {
    visible: boolean,
    error: boolean,
    icon: string,
    header: string,
    content: string,
    onDismiss: () => void,
    dismissParams: array
  };

  refMessage: {};

  componentWillReceiveProps(nextProps) {
    // If message has not been dismissed and content changes, we should move it into view
    const contentChanged = this.props.content !== nextProps.content;
    if (contentChanged) {
      this.focusMessage();
    }
  }

  setRefMessage = element => {
    this.refMessage = element;
  }

  dismiss = () => {
    // This will take the dismiss params and pass them to the onDismiss function
    const dismissParams = this.props.dismissParams || [];
    this.props.onDismiss(...dismissParams);
  };

  focusMessage = () => {
    if (this.refMessage) {
      this.refMessage.scrollIntoView(false);
    }
  };

  render() {
    // Renders a message with a fade transition
    // Ideally I wouldn't have to add the extra div but the styling gets messed up without it
    return (
      <Transition
        visible={this.props.visible}
        animation="fade"
        duration={100}
        onShow={this.focusMessage}
        mountOnShow={false}
      >
        <div ref={this.setRefMessage}>
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
