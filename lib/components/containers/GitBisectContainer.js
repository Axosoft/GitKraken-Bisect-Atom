'use babel';

import React from 'react';

import store from '../../store';
import * as actions from '../../actions';
import { State as StateConstants } from '../../constants';
import CommitList from '../presentation/CommitList';
import BisectControls from '../presentation/BisectControls';

const LOADING_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%'
};

const GIT_BISECT_CONTAINER_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  userSelect: 'none'
};

export default class GitBisectContainer extends React.Component {
  constructor() {
    super();
    this.state = store.getState();
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    store.addListener('transition', this.updateState);

    actions.initialize();
  }

  componentWillUnmount() {
    store.removeListener('transition', this.updateState);
  }

  updateState(newState) {
    this.setState(newState);
  }

  render() {
    const {
      bisectShas,
      commitListInDescendingOrder,
      state
    } = this.state;

    if (
      state === StateConstants.INIT
      || state === StateConstants.COMMIT_LIST_LOADING
    ) {
      return (
        <div style={LOADING_STYLE}>
          <span className='loading loading-spinner-large inline-block' />
        </div>
      );
    }

    return (
      <div style={GIT_BISECT_CONTAINER_STYLE}>
        <BisectControls
          onBisect={actions.beginBisect}
          onCancel={actions.cancel}
          state={state}
        />
        <CommitList
          bisectShas={bisectShas}
          commits={commitListInDescendingOrder}
          onCommitClick={actions.selectCommit}
        />
      </div>
    );
  }
}
