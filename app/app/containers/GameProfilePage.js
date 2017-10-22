import { connect } from 'react-redux';
import GameProfile from '../components/GameProfile';

function mapStateToProps(state) {
  return {
    store: state.game
  };
}

export default connect(mapStateToProps)(GameProfile);
