'use babel';

// NOTE EDGE CASE: possibility of packet containing first byte of second message length
import debug from 'debug';
import net from 'net';
import R from 'ramda';

import { Git as GitConstants } from './constants';

const log = debug('git-bisect:git-rs:client');

const FRAME_HEADER_SIZE = 4; // u32s are 4 bytes long.

const serializeMessage = (message) => {
  const payload = JSON.stringify(message);
  const payloadLength = Buffer.byteLength(payload);

  const frame = Buffer.alloc(FRAME_HEADER_SIZE + payloadLength);
  frame.writeUInt32BE(payloadLength, 0);
  frame.write(payload, FRAME_HEADER_SIZE);

  return frame;
};

const deserializeFrame = (buffer) => {
  const payloadLength = buffer.readUInt32BE(0);
  const payload = buffer.slice(FRAME_HEADER_SIZE, FRAME_HEADER_SIZE + payloadLength);
  return JSON.parse(payload);
};

const isCompleteMessage = R.propOr(false, 'isComplete');

export default async (port) => {
  const socket = new net.Socket();
  const takeRequestQueue = [];
  const messageQueue = [];
  let currentIndex = 0;

  const enqueueMessage = (buffer, isComplete) => messageQueue.push({ buffer, isComplete });
  const enqueueTakeRequest = resolver => takeRequestQueue.push(resolver);

  const getNextMessage = () => R.head(messageQueue);
  const getLastMessage = () => R.last(messageQueue);
  const popNextMessage = () => messageQueue.shift();

  const hasTakeRequest = () => takeRequestQueue.length > 0;
  const resolveNextTakeRequest = () => takeRequestQueue.shift()(popNextMessage());

  /**
   * Called if the current message length is less than total frame length
   */
  const copyMessageFrames = (frame) => {
    let newMessageOffset = 0;
    while (newMessageOffset < frame.length) {
      // If we're reading in a new message and there are not enough bytes left to read the length header
      if (currentIndex === 0 && frame.length - newMessageOffset < FRAME_HEADER_SIZE) {
        const partialMessageBuffer = new Buffer(FRAME_HEADER_SIZE);
        currentIndex = frame.copy(partialMessageBuffer, 0, newMessageOffset);
        enqueueMessage(partialMessageBuffer, false);
        return;
      }
      const newMessageLength = frame.readUInt32BE(newMessageOffset);
      const newMessageBuffer = new Buffer(newMessageLength + FRAME_HEADER_SIZE);

      const sourceEnd = newMessageOffset + newMessageLength + FRAME_HEADER_SIZE;
      currentIndex += frame.copy(newMessageBuffer, 0, newMessageOffset, sourceEnd);

      const messageHasBeenRead = currentIndex === newMessageBuffer.length;
      if (messageHasBeenRead) {
        currentIndex = 0;
      }

      enqueueMessage(newMessageBuffer, messageHasBeenRead);

      newMessageOffset += newMessageLength + FRAME_HEADER_SIZE;
    }
  };

  const processFrame = (frame) => {
    const lastMessage = getLastMessage();

    if (!lastMessage || (isCompleteMessage(lastMessage) && lastMessage.buffer.length === FRAME_HEADER_SIZE)) {
      copyMessageFrames(frame, 0);
      return;
    }

    // Buffer still needs to be fully allocated because length header was incomplete in last frame
    if (lastMessage.buffer.length === FRAME_HEADER_SIZE) {
      const inCompleteFrameBytesRead = frame.copy(lastMessage.buffer, currentIndex, 0, FRAME_HEADER_SIZE - currentIndex);
      currentIndex += inCompleteFrameBytesRead;
      // Somehow, we are still waiting on more bytes (edge-case-ception)
      if (currentIndex < FRAME_HEADER_SIZE) {
        return;
      }
      const discoveredMessageLength = lastMessage.buffer.readUInt32BE(0);
      lastMessage.buffer = new Buffer(discoveredMessageLength + FRAME_HEADER_SIZE);
      lastMessage.buffer.writeUInt32BE(discoveredMessageLength);
      frame = frame.slice(inCompleteFrameBytesRead);
    }

    const { buffer: lastMessageBuffer } = lastMessage;
    const frameBytesRead = frame.copy(
      lastMessageBuffer,
      currentIndex,
      0,
      lastMessageBuffer.length - currentIndex
    );

    /* Message is not complete and is awaiting more bytes */
    if (currentIndex + frameBytesRead !== lastMessageBuffer.length) {
      currentIndex += frameBytesRead;
      return;
    }

    lastMessage.isComplete = true;
    const remaining = frame.slice(lastMessageBuffer.length - currentIndex);
    currentIndex = 0;
    copyMessageFrames(remaining);
  };

  const notifyPromises = () => {
    if (!hasTakeRequest() || !isCompleteMessage(getNextMessage())) {
      return;
    }

    resolveNextTakeRequest();
    notifyPromises();
  };

  const takeMessage = async () => {
    const nextMessage = getNextMessage();

    if (!hasTakeRequest() && isCompleteMessage(nextMessage)) {
      return popNextMessage();
    }

    return await new Promise(enqueueTakeRequest);
  };

  const receiveMessage = async () => {
    const { buffer } = await takeMessage();
    return deserializeFrame(buffer);
  };

  const sendMessage = (message) => {
    const frame = serializeMessage(message);
    return socket.write(frame);
  };

  await new Promise((resolve, reject) => {
    let connectRetries = 0;

    socket.connect(port);

    const retryLoop = (err) => {
      if (err.message.includes('ECONNREFUSED')) {
        if (connectRetries >= GitConstants.client.MAX_CONNECT_RETRIES) {
          reject('Max number of git-rs server connection attempts reached');
          return;
        }

        connectRetries++;
        socket.destroy();

        setTimeout(() => {
          log('re-attempting to connect to git-rs server');
          socket.connect(port);
        }, GitConstants.client.WAIT_BETWEEN_CONNECT_RETRIES);
      }
    };

    socket.on('error', retryLoop);

    socket.on('connect', () => {
      socket.removeListener('error', retryLoop);
      resolve();
    });
  });

  socket.on('data', frame => {
    processFrame(frame);
    notifyPromises();
  });

  return {
    receiveMessage,
    sendMessage
  };
};
