import { Input, Button, Segment, Label } from 'semantic-ui-react';

import React, { Component } from 'react';

export default class ActionInput extends Component {
  props: {
    label: string,
    value: string,
    onClick: () => void,
    handlerParams: array
  };

  clickHandler = () => {
    // This will take the handlerParams params and pass them to the onClick function
    const handlerParams = this.props.handlerParams || [];
    this.props.onClick(...handlerParams);
  };

  render() {
    const actionButton = (
      <Button icon="upload" color="blue" onClick={this.clickHandler} />
    );

    const innerInput = (
      <input type="text" value={this.props.value} readOnly={true} />
    );

    return (
      <Segment basic={true}>
        <Label color={"green"} size="large" ribbon={true}>
          {this.props.label}
        </Label>
        <Input
          fluid={true}
          action={actionButton}
          input={innerInput}
        />
      </Segment>
    );
  }
}
