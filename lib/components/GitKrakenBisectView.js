'use babel';

import fs from 'fs';
import React from 'react';
import ReactDOM from 'react-dom';

import actions from '../actions';
import { Atom as AtomConstants } from '../constants';
import store from '../store';

import GitBisectContainer from './containers/GitBisectContainer';

class GitKrakenBisectView {
  constructor() {
    actions.queue.initialize();

    this.element = document.createElement('div');
    this.element.classList.add('gitkraken-bisect');

    ReactDOM.render(
      <GitBisectContainer />,
      this.element
    );
  }

  destroy = () => {
    const { git, watchedFile } = store.getState();

    actions.queue.destroy();

    if (git) {
      git.close();
    }
    if (watchedFile) {
      fs.unwatchFile(watchedFile);
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

  getURI = () => AtomConstants.GITKRAKEN_BISECT_URI;

  getTitle = () => AtomConstants.GITKRAKEN_BISECT_TITLE;
}

export default GitKrakenBisectView;
