import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FileLoader from '../components/FileLoader';
import * as FileLoaderActions from '../actions/fileLoader';

function mapStateToProps(state) {
  return {
    store: state.fileLoader
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(FileLoaderActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FileLoader);
