'use babel';

import React from 'react';
import ReactDOM from 'react-dom';

import actions from '../actions';
import { Atom as AtomConstants } from '../constants';
import store from '../store';

import GitBisectContainer from './containers/GitBisectContainer';

class GitBisectView {
  constructor() {
    actions.queue.initialize();

    this.element = document.createElement('div');
    this.element.classList.add('git-bisect');

    ReactDOM.render(
      <GitBisectContainer />,
      this.element
    );
  }

  destroy = () => {
    const { git, headWatcher } = store.getState();

    actions.queue.destroy();

    if (git) {
      git.close();
    }
    if (headWatcher) {
      headWatcher.stop();
    }

    store.resetState();

    if (this.element) {
      ReactDOM.unmountComponentAtNode(this.element);
      this.element.remove();
      this.element = null;
    }

    const pane = atom.workspace.paneForItem(this);
    if (pane) {
      pane.removeItem(this);
    }
  }

  getURI = () => AtomConstants.GIT_BISECT_URI;

  getTitle = () => AtomConstants.GIT_BISECT_TITLE;
}

export default GitBisectView;
