'use babel';

import beginBisect from './beginBisect';
import cancel from './cancel';
import finishBisect from './finishBisect';
import initialize from './initialize';
import loadCommitList from './loadCommitList';
import markCommit from './markCommit';
import openGitKraken from './openGitKraken';
import selectCommit from './selectCommit';

const actions = {
  beginBisect,
  cancel,
  finishBisect,
  initialize,
  loadCommitList,
  markCommit,
  openGitKraken,
  selectCommit
};

let actionPromiseChain;
let actionPromiseSession;

export default {
  queue: {
    destroy: () => {
      actionPromiseSession = null;
    },
    initialize: () => {
      actionPromiseChain = Promise.resolve();
      actionPromiseSession = Date.now();
    },
  },
  queued: new Proxy(actions, {
    get: (_actions, action) => {
      if (!_actions[action]) {
        throw new Error(`${action} is not an action.`);
      }
      const currentSession = actionPromiseSession;

      return (...args) => {
        let resolve;
        let reject;
        actionPromiseChain = actionPromiseChain
          .then(() => {
            if (currentSession !== actionPromiseSession) {
              return Promise.reject();
            }

            return Promise.resolve()
              .then(() => _actions[action](...args))
              .then(resolve)
              .catch((error) => {
                reject(error);
              });
          });

        return new Promise((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });
      };
    }
  }),
  unsafe: actions
};
