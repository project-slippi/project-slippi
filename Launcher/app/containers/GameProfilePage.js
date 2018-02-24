import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import GameProfile from '../components/stats/GameProfile';
import { playFile } from "../actions/fileLoader";

function mapStateToProps(state) {
  return {
    store: state.game,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ playFile: playFile }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(GameProfile);
