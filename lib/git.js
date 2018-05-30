'use babel';

import { Bisect as BisectConstants } from './constants';
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

    case 'Step':
      return {
        sha: message.current_commit_sha,
        status: BisectConstants.status.STEP
      };

    case 'ReachedMergeBase':
      return {
        sha: message.merge_base_sha,
        status: BisectConstants.status.REACHED_MERGE_BASE
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
    mergeBase: makeMergeBase(sendMessage, receiveMessage),
    openRepo: makeOpenRepo(sendMessage, receiveMessage)
  };
};
