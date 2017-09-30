const _ = require('lodash');

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Table, Statistic, Icon, Button, Sticky, Header } from 'semantic-ui-react'
import styles from './FileLoader.scss';
import FileRow from './FileRow';
import DismissibleMessage from './common/DismissibleMessage';
import PageHeader from './common/PageHeader';
import FolderBrowser from './common/FolderBrowser'

export default class FileLoader extends Component {
  props: {
    loadRootFolder: () => void,
    changeFolderSelection: (path) => void,
    dismissError: (key) => void,
    playFile: (file) => void,
    history: object,
    store: object
  };

  refPrimary: {};

  setRefPrimary = element => this.refPrimary = element;

  componentDidMount() {
    this.props.loadRootFolder();
  }

  componentWillUnmount() {
    this.props.dismissError("fileLoaderGlobal");
  }

  renderSidebar() {
    const refPrimary = this.refPrimary;
    const store = this.props.store || {};

    return (
      <Sticky context={refPrimary}>
        <div className={styles['sidebar']}>
          <FolderBrowser
            folders={store.folders}
            rootFolderName={store.rootFolderName}
            selectedFolderFullPath={store.selectedFolderFullPath}
            changeFolderSelection={this.props.changeFolderSelection}
          />
        </div>
      </Sticky>
    );
  }

  renderGlobalError() {
    const store = this.props.store || {};

    const showGlobalError = store.errorDisplayFlags.global || false;
    const globalErrorMessage = store.errorMessages.global || "";
    return (
      <DismissibleMessage
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={["fileLoaderGlobal"]}
      />
    );
  }

  renderEmptyLoader() {
      return (
        <div className={styles['empty-loader-content']}>
          <Header as='h2' icon={true} inverted={true} textAlign="center">
            <Icon name="search" />
            <Header.Content>
              No Replay Files Found
              <Header.Subheader>
                Please load a folder that contains .slp files
              </Header.Subheader>
            </Header.Content>
          </Header>
        </div>
      )
  }

  renderFileSelection() {
    const store = this.props.store || {};
    let files = store.files || [];

    // Filter out files that were shorter than 30 seconds
    files = files.filter(function (file) {
      const gameInfo = file.gameInfo || {};
      const totalFrames = gameInfo.totalFrames || 0;
      return totalFrames > 30 * 60;
    });

    // If we have no files to display, render an empty state
    if (!files.length) {
        return this.renderEmptyLoader();
    }

    // Generate header row
    const headerRow = (
      <Table.Row>
        <Table.HeaderCell />
        <Table.HeaderCell>File</Table.HeaderCell>
        <Table.HeaderCell>Characters</Table.HeaderCell>
        <Table.HeaderCell>Stage</Table.HeaderCell>
        <Table.HeaderCell>Duration</Table.HeaderCell>
      </Table.Row>
    );

    // Generate a row for every file in selected folder
    const rows = files.map(function (file) {
      const fileName = file.fullPath;

      return (
        <FileRow
          key={fileName}
          file={file}
          playFile={this.props.playFile}
        />
      );
    }, this);

    return (
      <Table basic="very" celled={true} inverted={true} selectable={true}>
        <Table.Header>
          {headerRow}
        </Table.Header>
        <Table.Body>
          {rows}
        </Table.Body>
      </Table>
    );
  }

  renderMain() {
    return (
      <div className="main-padding">
        <PageHeader icon="disk outline" text="Replay Loader" history={this.props.history} />
        {this.renderGlobalError()}
        {this.renderFileSelection()}
      </div>
    )
  }

  render() {
    // TODO: On component unmount, clear all current settings
    return (
      <div ref={this.setRefPrimary} className={styles['layout']}>
        {this.renderSidebar()}
        {this.renderMain()}
      </div>
    );
  }
}
