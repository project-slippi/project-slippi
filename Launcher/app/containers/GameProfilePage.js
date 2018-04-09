import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import GameProfile from '../components/stats/GameProfile';
import { playFile } from "../actions/fileLoader";
import { dismissError } from "../actions/error";

function mapStateToProps(state) {
  return {
    store: state.game,
    errors: state.errors,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    playFile: playFile,
    dismissError: dismissError,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(GameProfile);
