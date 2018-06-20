import React, { Component } from 'react';
import { Container, Segment, Button } from 'semantic-ui-react';
import { connect } from 'react-redux';

import { browseFolder, selectFolder, browseFile, selectFile, saveSettings, clearChanges } from '../actions/settings';
import PageHeader from '../components/common/PageHeader';
import ActionInput from '../components/common/ActionInput';

const _ = require('lodash');

class Settings extends Component {
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

function mapStateToProps(state) {
  return {
    store: state.settings,
  };
}

export default connect(mapStateToProps, {
  browseFolder,
  selectFolder,
  browseFile,
  selectFile,
  saveSettings,
  clearChanges
})(Settings);

