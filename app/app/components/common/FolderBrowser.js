const _ = require('lodash');

import React, { Component } from 'react';
import { List, Segment } from 'semantic-ui-react'

export default class FolderBrowser extends Component {
  props: {
    folders: object,
    rootFolderName: string,
    onSelect: () => void,
    toggleExpand: () => void
  };

  generateFolderItem(folderDetails) {
    // Generate sub-directory folder items
    const subDirectories = folderDetails.subDirectories || {};
    const self = this; // I don't know how to pass context to map...
    const subFolderItems = _.map(subDirectories, function (iFolderDetails) {
      return self.generateFolderItem(iFolderDetails);
    });

    return (
      <List.Item key={folderDetails.fullPath}>
        <List.Icon name="folder" />
        <List.Content>
          <List.Header>
            {folderDetails.folderName}
          </List.Header>
          <List.List>
            {subFolderItems}
          </List.List>
        </List.Content>
      </List.Item>
    );
  }

  renderEmpty() {
    return <div>Hello</div>;
  }

  render() {
    const folders = this.props.folders || {};
    const rootFolderName = this.props.rootFolderName || "";

    const rootFolderDetails = folders[rootFolderName];

    // Render empty state if we can't find the root folder
    if (!rootFolderDetails) {
      return this.renderEmpty();
    }

    return (
      <Segment basic={true}>
        <List inverted={true}>
          {this.generateFolderItem(rootFolderDetails)}
        </List>
      </Segment>
    );
  }
}
