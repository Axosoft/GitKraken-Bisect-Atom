'use babel';

import { Bisect as BisectConstants } from './constants';
import makeGitRsClient from './gitRsClient';
import gitRsServer from './gitRsServer';

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
    case 'Error':
      if (message.reason === 'AlreadyBisecting') {
        return {
          status: BisectConstants.status.IS_BISECTING
        };
      }

      throw new Error(`Bisect error "${message.reason}" not handled`);

    case 'Finish':
      if (message.FoundSingle) {
        return {
          sha: message.FoundSingle.bad_commit_sha,
          status: BisectConstants.status.FINISHED_SINGLE
        };
      }

      if (message.FoundRange) {
        return {
          shas: {
            bad: message.FoundRange.bad_commit_sha,
            good: message.FoundRange.good_commit_sha
          },
          status: BisectConstants.status.FINISHED_RANGE
        };
      }

      throw new Error('Bisect provided an unknown finish type');

    case 'ReachedMergeBase':
      return {
        sha: message.merge_base_sha,
        status: BisectConstants.status.REACHED_MERGE_BASE
      };

    case 'Step':
      return {
        sha: message.current_commit_sha,
        status: BisectConstants.status.STEP
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
  },

  visualize: async () => {
    await sendMessage({
      type: 'Visualize'
    });
    const { type, shas } = await receiveMessage();

    if (type !== 'Visualize') {
      throw new Error('git bisect visualize failed to produce output');
    }

    return shas;
  }
});

const makeMergeBase = (sendMessage, receiveMessage) => ({
  isAncestor: async (ancestor_sha, descendant_sha) => {
    await sendMessage({
      type: 'GitCommand',
      MergeBase: {
        IsAncestor: {
          ancestor_sha,
          descendant_sha
        }
      }
    });
    const { type, is_ancestor } = await receiveMessage();

    if (type !== 'Success') {
      throw new Error('git merge-base failed to produce result');
    }

    return is_ancestor;
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

const makeStatus = (sendMessage, receiveMessage) => async () => {
  await sendMessage({ type: 'GitCommand', Status: null });
  const { type, status } = await receiveMessage();

  if (type !== 'Success') {
    throw new Error('Status failed');
  }

  return status;
};

const performHandshake = async (sendMessage, receiveMessage) => {
  await receiveMessage();
  await sendMessage({ type: 'Hello' });
  await receiveMessage();
};

export default async () => {
  const serverPort = await gitRsServer.start();
  const { sendMessage, receiveMessage } = await makeGitRsClient(serverPort);

  await performHandshake(sendMessage, receiveMessage);

  return {
    bisect: makeBisect(sendMessage, receiveMessage),
    close: async () => {
      await sendMessage({ type: 'Goodbye' });
      await receiveMessage();
      gitRsServer.stop();
    },
    log: makeLog(sendMessage, receiveMessage),
    mergeBase: makeMergeBase(sendMessage, receiveMessage),
    openRepo: makeOpenRepo(sendMessage, receiveMessage),
    status: makeStatus(sendMessage, receiveMessage)
  };
};
