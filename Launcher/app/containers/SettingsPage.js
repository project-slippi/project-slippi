import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Settings from '../components/Settings';
import * as SettingsActions from '../actions/settings';
import * as ErrorActions from '../actions/error';

function mapStateToProps(state) {
  return {
    store: state.settings,
    errors: state.errors,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, SettingsActions, ErrorActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
