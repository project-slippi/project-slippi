/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import FileLoaderPage from './containers/FileLoaderPage';

export default () => (
  <App>
    <Switch>
      <Route path="/files" component={FileLoaderPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
