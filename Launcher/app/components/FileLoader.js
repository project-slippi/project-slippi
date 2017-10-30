import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Table, Icon, Sticky, Header, Button, Segment } from 'semantic-ui-react';
import styles from './FileLoader.scss';
import FileRow from './FileRow';
import DismissibleMessage from './common/DismissibleMessage';
import PageHeader from './common/PageHeader';
import FolderBrowser from './common/FolderBrowser';

export default class FileLoader extends Component {
  props: {
    // fileLoader actions
    loadRootFolder: () => void,
    changeFolderSelection: (path) => void,
    playFile: (file) => void,

    // game actions
    gameProfileLoad: (path) => void,

    // error actions
    dismissError: (key) => void,

    // store data
    history: object,
    store: object,
    errors: object
  };

  refPrimary: {};

  componentDidMount() {
    this.props.loadRootFolder();
  }

  componentWillUnmount() {
    this.props.dismissError('fileLoader-global');
  }

  setRefPrimary = element => {
    this.refPrimary = element;
  };

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
    const errors = this.props.errors || {};
    const errorKey = 'fileLoader-global';

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

  renderEmptyLoader() {
    const folders = this.props.store.folders || {};
    const rootFolderName = this.props.store.rootFolderName || '';

    if (!folders[rootFolderName]) {
      return this.renderMissingRootFolder();
    }

    return (
      <div className={styles['empty-loader-content']}>
        <Header as="h2" icon={true} color="grey" inverted={true} textAlign="center">
          <Icon name="search" />
          <Header.Content>
            No Replay Files Found
            <Header.Subheader>
              Place slp files in the folder to browse
            </Header.Subheader>
          </Header.Content>
        </Header>
      </div>
    );
  }

  renderMissingRootFolder() {
    return (
      <div className={styles['empty-loader-content']}>
        <Header as="h2" icon={true} color="grey" inverted={true} textAlign="center">
          <Icon name="folder outline" />
          <Header.Content>
            Root Folder Missing
            <Header.Subheader>
              Go to the settings page to select a root slp folder
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Segment basic={true} textAlign="center">
          <Link to="/settings">
            <Button color="blue" size="large">
              Select Folder
            </Button>
          </Link>
        </Segment>
      </div>
    );
  }

  renderFileSelection() {
    const store = this.props.store || {};
    let files = store.files || [];

    // Filter out files that were shorter than 30 seconds
    files = files.filter(file => {
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
        <Table.HeaderCell />
      </Table.Row>
    );

    // Generate a row for every file in selected folder
    const rows = files.map(file => (
      <FileRow
        key={file.fullPath}
        file={file}
        playFile={this.props.playFile}
        gameProfileLoad={this.props.gameProfileLoad}
        history={this.props.history}
      />
    ), this);

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
    );
  }

  render() {
    return (
      <div ref={this.setRefPrimary} className={styles['layout']}>
        {this.renderSidebar()}
        {this.renderMain()}
      </div>
    );
  }
}
