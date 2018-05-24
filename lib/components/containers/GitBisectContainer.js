'use babel';

import React from 'react';
import store from '../../store';
import { initialize } from '../../actions';
import { State as StateConstants } from '../../constants';
import CommitList from '../presentation/CommitList';

export default class GitBisectContainer extends React.Component {
  constructor() {
    super();
    this.state = store.getState();
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    store.addListener('transition', this.updateState);

    initialize();
  }

  componentWillUnmount() {
    store.removeListener('transition', this.updateState);
  }

  updateState(newState) {
    this.setState(newState);
  }

  render() {
    console.log(this.state);
    const {
      commitListInDescendingOrder,
      state
    } = this.state;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div>Current state: {state}</div>
        <CommitList commits={commitListInDescendingOrder} />
      </div>
    );
  }
}
