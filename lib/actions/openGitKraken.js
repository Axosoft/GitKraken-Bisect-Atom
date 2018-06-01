'use babel';

import { spawn } from 'child_process';
import { shell } from 'electron';

import store from '../store';

export default () => {
  const { hasGitKraken, repoPath } = store.getState();

  if (hasGitKraken) {
    spawn('gitkraken', ['-p', repoPath], {
      detached: true,
      stdio: 'ignore'
    });
  } else {
    shell.openExternal('https://www.gitkraken.com/');
  }
};
