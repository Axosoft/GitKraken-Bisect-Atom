'use babel';

import { State as StateConstants } from '../constants';
import store from '../store';

export default () => {
  store.move(StateConstants.COMMIT_LIST_SHOWN);
};
