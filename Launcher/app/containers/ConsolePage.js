import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Console from '../components/Console';
import * as ConsoleActions from '../actions/console';

function mapStateToProps(state) {
  return {
    store: state.console,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ConsoleActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Console);
