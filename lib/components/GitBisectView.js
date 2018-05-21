'use babel';

import React from 'react';
import ReactDOM from 'react-dom';

import { GIT_BISECT_TITLE } from '../constants/AtomConstants';

class GitBisectView {
  constructor() {
    this.element = document.createElement('div');

    ReactDOM.render(
      <div>Hello world</div>,
      this.element
    );
  }

  destroy = () => {
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

  getTitle = () => GIT_BISECT_TITLE;
}

export default GitBisectView;
