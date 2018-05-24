'use babel';

import beginBisect from './beginBisect';
import cancel from './cancel';
import finishBisect from './finishBisect';
import initialize from './initialize';
import loadCommitList from './loadCommitList';
import markCommit from './markCommit';
import selectCommit from './selectCommit';

let actionPromiseChain = Promise.resolve();
const actions = new Proxy({
  beginBisect,
  cancel,
  finishBisect,
  initialize,
  loadCommitList,
  markCommit,
  selectCommit
}, {
  get: (_actions, action) => {
    if (action === '__esModule') {
      return false;
    }

    if (!_actions[action]) {
      throw new Error(`${action} is not an action.`);
    }

    return (...args) => {
      actionPromiseChain = actionPromiseChain
        .then(
          () => _actions[action](...args),
          () => _actions[action](...args)
        );
      return actionPromiseChain;
    };
  }
});

export default actions;
