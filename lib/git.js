'use babel';

import moment from 'moment';
import R from 'ramda';

import makeGitRsClient from './gitRsClient';

const makeLog = (sendMessage, receiveMessage) => async () => {
  await sendMessage({ type: 'GitCommand', Log: null });
  const { type, log } = await receiveMessage();

  if (type !== 'Success') {
    throw new Error('Log failed to produce commits');
  }

  return log;
};

const getMaybeCurrentBisectCommit = (message) => {
  switch (message.type) {
    case 'Finish':
      // TODO Implement bad range

      return {
        done: true,
        sha: message.bad_commit_sha
      };

    case 'Step':
      return {
        done: false,
        sha: message.current_commit_sha
      };

    case 'ReachedMergeBase':
      // TODO Reset merge base

      return {
        done: false,
        sha: message.merge_base_sha
      };

    default:
      throw new Error('Bisect failed to produce next step');
  }
};

const makeBisect = (sendMessage, receiveMessage) => ({
  start: async (good, bad) => {
    await sendMessage({
      type: 'GitCommand',
      Bisect: {
        good,
        bad
      }
    });
    const response = await receiveMessage();
    return getMaybeCurrentBisectCommit(response);
  },

  reset: async () => {
    await sendMessage({
      type: 'Reset'
    });
    await receiveMessage();
  },

  mark: async (isGood) => {
    const marker = isGood
      ? { type: 'Good' }
      : { type: 'Bad' };
    await sendMessage(marker);
    const response = await receiveMessage();
    return getMaybeCurrentBisectCommit(response);
  }
});

const makeOpenRepo = (sendMessage, receiveMessage) => async (repoPath) => {
  await sendMessage({
    type: 'GitCommand',
    OpenRepo: {
      path: repoPath
    }
  });
  await receiveMessage();
};

const performHandshake = async (sendMessage, receiveMessage) => {
  await receiveMessage();
  await sendMessage({ type: 'Hello' });
  await receiveMessage();
};

export default async () => {
  const { sendMessage, receiveMessage } = makeGitRsClient(5134);

  await performHandshake(sendMessage, receiveMessage);

  return {
    bisect: makeBisect(sendMessage, receiveMessage),
    close: async () => {
      await sendMessage({ type: 'Goodbye' });
      await receiveMessage();
    },
    log: makeLog(sendMessage, receiveMessage),
    openRepo: makeOpenRepo(sendMessage, receiveMessage)
  }
}
