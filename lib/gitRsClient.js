'use babel';

// NOTE EDGE CASE: possibility of packet containing first byte of second message length
import net from 'net';
import R from 'ramda';

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

export default (port) => {
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
      const newMessageLength = frame.readUInt32BE(newMessageOffset);
      const newMessageBuffer = new Buffer(newMessageLength + FRAME_HEADER_SIZE);

      // NOTE could be issue with multiple packets
      currentIndex += frame.copy(newMessageBuffer, 0, newMessageOffset);

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
    if (!lastMessage || isCompleteMessage(lastMessage)) {
      copyMessageFrames(frame);
      return;
    }

    const { buffer: lastMessageBuffer } = getLastMessage();
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

  socket.connect(port);
  socket.on('data', frame => {
    processFrame(frame);
    notifyPromises();
  });

  return {
    receiveMessage,
    sendMessage
  };
};
