'use babel';

import { spawn } from 'child_process';
import path from 'path';

const VENDORS_PATH = path.join(__dirname, '..', 'vendors');
const GIT_RS_CMD = process.platform === 'win32' ? 'git_server.exe' : './git_server';

const MIN_PORT_NUMBER = 1024;
const MAX_PORT_NUMBER = 49151;
const NUM_VALID_PORT_NUMBERS = MAX_PORT_NUMBER - MIN_PORT_NUMBER + 1;
const generatePortNumber = () => Math.floor(Math.random() * NUM_VALID_PORT_NUMBERS) + MIN_PORT_NUMBER;

let currentServerProcess = null;
let currentServerPort = 0;

const spawnServerProcess = () => new Promise((resolve, reject) => {
  const port = generatePortNumber();
  const serverProcess = spawn(GIT_RS_CMD, ['-p', port], { cwd: VENDORS_PATH });

  serverProcess.stdout.on('data', (data) => {
    if (Number(data) === port) {
      console.log(`git-rs server: running on port ${port}`); // eslint-disable-line no-console

      currentServerPort = serverProcess;
      currentServerPort = port;
      resolve(port);
    }
  });

  serverProcess.on('close', (code) => {
    if (code === 98) { // Port already in use
      console.log(`git-rs server: port ${port} already in use, re-attempting with different port`); // eslint-disable-line no-console
      resolve(spawnServerProcess());
    } else {
      console.log(`git-rs server: process exited with code ${code}`); // eslint-disable-line no-console
      reject('Failed to start git-rs server');
    }
  });
});

export default {
  start: async () => {
    if (currentServerProcess) {
      return Promise.resolve(currentServerPort);
    }

    return spawnServerProcess();
  },
  stop: () => {
    if (currentServerProcess) {
      currentServerProcess.kill();
      currentServerProcess = null;
      currentServerPort = 0;
    }
  }
};
