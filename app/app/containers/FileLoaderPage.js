const _ = require('lodash');

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FileLoader from '../components/FileLoader';
import * as FileLoaderActions from '../actions/fileLoader';
import * as ErrorActions from '../actions/error';

function mapStateToProps(state) {
  return {
    store: state.fileLoader,
    errors: state.errors
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, FileLoaderActions, ErrorActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FileLoader);
