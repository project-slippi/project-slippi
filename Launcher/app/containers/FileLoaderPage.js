// import { bindActionCreators } from 'redux';
// import { connect } from 'react-redux';
// import FileLoader from '../components/FileLoader';
// import * as FileLoaderActions from '../actions/fileLoader';
// import * as GameActions from '../actions/game';
// import * as ErrorActions from '../actions/error';

// const _ = require('lodash');

// function mapStateToProps(state) {
//   return {
//     store: state.fileLoader,
//     errors: state.errors,
//   };
// }

// function mapDispatchToProps(dispatch) {
//   const allActions = _.extend({}, FileLoaderActions, GameActions, ErrorActions);
//   return bindActionCreators(allActions, dispatch);
// }

// export default connect(mapStateToProps, mapDispatchToProps)(FileLoader);
