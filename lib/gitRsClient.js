'use babel';

import debug from 'debug';
import JSONLengthDelimitedStream from 'json-length-delimited-stream';
import { Socket } from 'net';
import R from 'ramda';

import { Git as GitConstants } from './constants';

const log = debug('gitkraken-bisect:git-rs:client');

const FRAME_HEADER_SIZE = 4; // u32s are 4 bytes long.

const serializeMessage = (message) => {
  const payload = JSON.stringify(message);
  const payloadLength = Buffer.byteLength(payload);

  const frame = Buffer.alloc(FRAME_HEADER_SIZE + payloadLength);
  frame.writeUInt32BE(payloadLength, 0);
  frame.write(payload, FRAME_HEADER_SIZE);

  return frame;
};

export default async (port) => {
  const socket = await new Promise((resolve, reject) => {
    const _socket = new Socket();
    let connectRetries = 0;

    _socket.connect(port);

    const retryLoop = (err) => {
      if (err.message.includes('ECONNREFUSED')) {
        if (connectRetries >= GitConstants.client.MAX_CONNECT_RETRIES) {
          reject('Max number of git-rs server connection attempts reached');
          return;
        }

        connectRetries++;
        _socket.destroy();

        setTimeout(() => {
          log('re-attempting to connect to git-rs server');
          _socket.connect(port);
        }, GitConstants.client.WAIT_BETWEEN_CONNECT_RETRIES);
      }
    };

    _socket.on('error', retryLoop);

    _socket.on('connect', () => {
      _socket.removeListener('error', retryLoop);
      resolve(_socket);
    });
  });

  debugger;

  const receivedMessages = [];
  const messageCallbackQueue = [];
  const jsonStream = new JSONLengthDelimitedStream(socket, { frameLengthInBytes: FRAME_HEADER_SIZE });

  jsonStream.on('data', (message) => {
    receivedMessages.push(message);

    if (messageCallbackQueue.length) {
      messageCallbackQueue.shift()(receivedMessages.shift());
    }
  });

  return {
    receiveMessage: () => new Promise((resolve) => {
      if (messageCallbackQueue.length === 0 && receivedMessages.length > 0) {
        resolve(receivedMessages.shift());
      } else {
        messageCallbackQueue.push(resolve);
      }
    }),
    sendMessage: message => socket.write(serializeMessage(message))
  };
};
