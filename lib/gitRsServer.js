'use babel';

import { spawn } from 'child_process';
import debug from 'debug';
import path from 'path';

const log = debug('gitkraken-bisect:git-rs:server');
const GITRS_PATH = path.join(__dirname, '..', 'vendor', 'gitrs');
const GIT_RS_CMD = process.platform === 'win32' ? 'git_server.exe' : './git_server';
const GIT_VENDOR_PATH = path.join(GITRS_PATH, 'vendor');
const GIT_BINARY_PATH = process.platform === 'win32'
  ? path.join(GIT_VENDOR_PATH, 'cmd')
  : path.join(GIT_VENDOR_PATH, 'bin');
const GIT_EXEC_PATH = process.platform === 'win32'
  ? path.join(GIT_VENDOR_PATH, 'mingw64', 'libexec', 'git-core')
  : path.join(GIT_VENDOR_PATH, 'libexec', 'git-core');
const GIT_ENV_PATH = process.platform === 'win32'
  ? `${GIT_BINARY_PATH};${GIT_VENDOR_PATH}\\mingw64\\bin;${GIT_VENDOR_PATH}\\mingw64\\usr\\bin`
  : `${GIT_BINARY_PATH}`;

const MIN_PORT_NUMBER = 1024;
const MAX_PORT_NUMBER = 49151;
const NUM_VALID_PORT_NUMBERS = MAX_PORT_NUMBER - MIN_PORT_NUMBER + 1;
const generatePortNumber = () => Math.floor(Math.random() * NUM_VALID_PORT_NUMBERS) + MIN_PORT_NUMBER;

let currentServerProcess = null;
let currentServerPort = 0;

const spawnServerProcess = () => new Promise((resolve, reject) => {
  const port = generatePortNumber();
  const serverProcess = spawn(GIT_RS_CMD, ['-p', port, '-g', GIT_ENV_PATH, '-e', GIT_EXEC_PATH], { cwd: GITRS_PATH });

  serverProcess.stdout.on('data', (data) => {
    if (Number(data) === port) {
      log(`running on port ${port}`);

      currentServerPort = serverProcess;
      currentServerPort = port;
      resolve(port);
      return;
    }

    log(data.toString());
  });

  serverProcess.on('close', (code) => {
    if (code === 98) { // Port already in use
      log(`port ${port} already in use, re-attempting with different port`);
      resolve(spawnServerProcess());
    } else {
      log(`process exited with code ${code}`);
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
