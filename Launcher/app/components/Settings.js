import React, { Component } from 'react';
import { Container, Segment, Button } from 'semantic-ui-react';
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput';

const _ = require('lodash');

export default class Settings extends Component {
  props: {
    browseFolder: () => void,
    browseFile: () => void,
    saveSettings: () => void,
    clearChanges: () => void,
    history: object,
    store: object
  };

  componentWillUnmount() {
    this.props.clearChanges();
  }

  renderSave() {
    const store = this.props.store || {};

    const extraProps = {};
    if (_.isEqual(store.currentSettings, store.storedSettings)) {
      // This will disable the button if there's nothing to save
      extraProps.disabled = true;
    }

    return (
      <Segment basic={true}>
        <Button
          {...extraProps}
          content="Save"
          color="blue"
          size="big"
          onClick={this.props.saveSettings}
        />
      </Segment>
    );
  }

  renderContent() {
    const store = this.props.store || {};

    // TODO: Add options for file type filtering and folder only
    return (
      <Container text={true}>
        <ActionInput
          label="Melee ISO File"
          value={store.currentSettings.isoPath}
          onClick={this.props.browseFile}
          handlerParams={['isoPath']}
        />
        <ActionInput
          label="Replay Root Directory"
          value={store.currentSettings.rootSlpPath}
          onClick={this.props.browseFolder}
          handlerParams={['rootSlpPath']}
        />
        {this.renderSave()}
      </Container>
    );
  }

  render() {
    return (
      <div className="main-padding">
        <PageHeader icon="setting" text="Settings" history={this.props.history} />
        {this.renderContent()}
      </div>
    );
  }
}
