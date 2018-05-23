'use babel';

import React from 'react';
import ReactDOM from 'react-dom';

import { Atom as AtomConstants } from '../constants';
import store from '../store';

import CommitListContainer from './containers/CommitListContainer';

class GitBisectView {
  constructor() {
    this.element = document.createElement('div');

    ReactDOM.render(
      <div />,
      this.element
    );
  }

  destroy = () => {
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
