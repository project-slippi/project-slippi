import React, { Component } from 'react';
import { Container, Segment, Button } from 'semantic-ui-react';
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput';
import LabelDescription from './common/LabelDescription';
import DismissibleMessage from './common/DismissibleMessage';

const _ = require('lodash');

export default class Settings extends Component {
  props: {
    browseFolder: () => void,
    browseFile: () => void,
    saveSettings: () => void,
    clearChanges: () => void,
    openDolphin: () => void,

    // error actions
    dismissError: (key) => void,

    // store data
    history: object,
    store: object,
    errors: object,
  };

  componentWillUnmount() {
    this.props.clearChanges();
  }

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'settings-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || "";
    return (
      <DismissibleMessage
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={[errorKey]}
      />
    );
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

  renderConfigDolphin() {
    return (
      <Segment basic={true}>
        <LabelDescription
          label="Configure Playback Dolphin"
          description={`
            The Dolphin used to play replay files is stored somewhere in the
            depths of your file system. This button will open that Dolphin for
            you so that you can change settings.
          `}
        />
        <Button
          content="Configure Dolphin"
          color="green"
          size="medium"
          basic={true}
          inverted={true}
          onClick={this.props.openDolphin}
        />
      </Segment>
    );
  }

  renderContent() {
    const store = this.props.store || {};

    // TODO: Add options for file type filtering and folder only
    return (
      <Container text={true}>
        {this.renderGlobalError()}
        <ActionInput
          label="Melee ISO File"
          description="The path to a NTSC Melee 1.02 ISO. Used for playing replay files"
          value={store.currentSettings.isoPath}
          onClick={this.props.browseFile}
          handlerParams={['isoPath']}
        />
        <ActionInput
          label="Replay Root Directory"
          description={
            "The folder where your slp files are stored. Will usually be the " +
            "Slippi folder located with Dolphin"
          }
          value={store.currentSettings.rootSlpPath}
          onClick={this.props.browseFolder}
          handlerParams={['rootSlpPath']}
        />
        {this.renderSave()}
        {this.renderConfigDolphin()}
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
