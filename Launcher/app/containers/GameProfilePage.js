import { connect } from 'react-redux';
import GameProfile from '../components/stats/GameProfile';

function mapStateToProps(state) {
  return {
    store: state.game
  };
}

export default connect(mapStateToProps)(GameProfile);
