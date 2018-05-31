'use babel';

import { spawn } from 'child_process';
import path from 'path';

const vendorsPath = path.join(__dirname, '..', 'vendors');
const cmd = process.platform === 'win32' ? 'git_server.exe' : './git_server';
let serverProcess;

export default {
  start: () => {
    if (serverProcess) {
      return;
    }

    serverProcess = spawn(cmd, { cwd: vendorsPath });
    console.log('git-rs server started');

    serverProcess.on('close', (code) => {
      console.log(`git-rs server process exited with code ${code}`); // eslint-disable-line no-console
    });
  },
  stop: () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  }
};
