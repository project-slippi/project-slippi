import React, { Component } from 'react';
import { List, Segment, Header, Icon } from 'semantic-ui-react';
import styles from './FolderBrowser.scss';

const _ = require('lodash');
const classNames = require('classnames');

export default class FolderBrowser extends Component {
  props: {
    folders: object,
    rootFolderName: string,
    selectedFolderFullPath: string,
    changeFolderSelection: (path) => void
  };

  selectFolder = (folderFullPath) => {
    this.props.changeFolderSelection(folderFullPath);
  };

  generateFolderItem(folderDetails) {
    // Generate sub-directory folder items
    const subDirectories = folderDetails.subDirectories || {};
    const self = this; // I don't know how to pass context to map...
    const subFolderItems = _.map(subDirectories, iFolderDetails => (
      self.generateFolderItem(iFolderDetails)
    ));

    // Generate directory listing if we have subdirectories
    let subDirectoryList = null;
    if (_.some(subFolderItems)) {
      subDirectoryList = (
        <List.List className="no-padding">
          {subFolderItems}
        </List.List>
      );
    }

    // Generate styles for selection
    const currentSelection = this.props.selectedFolderFullPath;
    const selectorClasses = classNames({
      [styles['selected']]: currentSelection === folderDetails.fullPath
    }, styles['folder-selection']);

    return [
      <div
        key="selector"
        role="presentation"
        className={selectorClasses}
        onClick={_.partial(this.selectFolder, folderDetails.fullPath)}
      />,
      <List.Item key={folderDetails.fullPath}>
        <List.Icon name="folder" />
        <List.Content>
          <List.Header className="unselectable">
            {folderDetails.folderName}
          </List.Header>
          {subDirectoryList}
        </List.Content>
      </List.Item>
    ];
  }

  renderEmpty() {
    return (
      <Segment basic={true}>
        <Header as="h3" className={styles['empty-state']} icon={true} color="grey" textAlign="center">
          <Icon name="folder open outline" />
          <Header.Content>
            Folder Browser
          </Header.Content>
        </Header>
      </Segment>
    );
  }

  render() {
    const folders = this.props.folders || {};
    const rootFolderName = this.props.rootFolderName || '';

    const rootFolderDetails = folders[rootFolderName];

    // Render empty state if we can't find the root folder
    if (!rootFolderDetails) {
      return this.renderEmpty();
    }

    return (
      <Segment basic={true} className={styles['main']}>
        <List inverted={true}>
          {this.generateFolderItem(rootFolderDetails)}
        </List>
      </Segment>
    );
  }
}
