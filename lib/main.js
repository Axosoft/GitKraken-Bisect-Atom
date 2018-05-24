'use babel';

import { CompositeDisposable } from 'atom';

import { Atom as AtomConstants } from './constants';

import GitBisectView from './components/GitBisectView';

let subscriptions = null;

const activate = () => {
  subscriptions = new CompositeDisposable();
  subscriptions.add(atom.workspace.addOpener(uri => {
    if (uri === AtomConstants.GIT_BISECT_URI) return new GitBisectView();
  }));

  subscriptions.add(atom.commands.add('atom-workspace', {
    'git-bisect:open': () => {
      const repos = atom.project.getRepositories().filter(Boolean);

      if (repos.length === 0) {
        atom.notifications.addWarning('You do not have a project with a git repository open.')
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
  }
  subscriptions = null;
};

export default {
  activate,
  deactivate
};
