'use babel';

import { CompositeDisposable } from 'atom';

import { Atom as AtomConstants } from './constants';
import GitBisectView from './components/GitBisectView';
import gitRsServer from './gitRsServer';

let subscriptions = null;
let gitBisectView = null;

const activate = () => {
  subscriptions = new CompositeDisposable();
  subscriptions.add(atom.workspace.addOpener(uri => {
    if (uri === AtomConstants.GIT_BISECT_URI) {
      gitBisectView = new GitBisectView();
      return gitBisectView;
    }
  }));

  subscriptions.add(atom.commands.add('atom-workspace', {
    'git-bisect:open': () => {
      if (atom.workspace.paneForURI(AtomConstants.GIT_BISECT_URI)) {
        return;
      }

      const repos = atom.project.getRepositories().filter(Boolean);

      if (repos.length === 0) {
        atom.notifications.addWarning('You do not have a project with a git repository open.');
        return;
      }
      if (repos.length > 1) {
        atom.notifications.addWarning('You have more than one project with a git repository open right now');
        return;
      }

      atom.workspace.open(AtomConstants.GIT_BISECT_URI, {
        location: 'right'
      });
    }
  }));
};

const deactivate = () => {
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }

  if (gitBisectView) {
    gitBisectView.destroy();
    gitBisectView = null;
  }

  gitRsServer.stop();
};

export default {
  activate,
  deactivate
};
