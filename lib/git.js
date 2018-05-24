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

  // Perform handshake
  await performHandshake(sendMessage, receiveMessage);

  return {
    log: makeLog(sendMessage, receiveMessage),
    openRepo: makeOpenRepo(sendMessage, receiveMessage),
  }
}
