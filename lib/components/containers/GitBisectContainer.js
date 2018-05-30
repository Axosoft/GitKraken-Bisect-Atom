'use babel';

import classnames from 'classnames';
import React from 'react';

import store from '../../store';
import actions from '../../actions';
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

    actions.initialize()
      .then(() => actions.loadCommitList());
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
      isGoodBySha,
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

    const classes = classnames({
      'highlight-commits': state === StateConstants.BISECT_COMMIT_CHECKED_OUT
        || state === StateConstants.BISECT_CHECKOUT_TRIGGERED
        || state === StateConstants.BISECT_REACHED_MERGE_BASE
        || state === StateConstants.BISECT_SHAS_CALCULATED
        || state === StateConstants.BISECT_COMPLETED_RANGE
        || state === StateConstants.BISECT_COMPLETED_SINGLE
    });

    return (
      <div className={classes} style={GIT_BISECT_CONTAINER_STYLE}>
        <BisectControls
          onBegin={actions.beginBisect}
          onCancel={actions.cancel}
          onComplete={actions.finishBisect}
          onMarkCommit={actions.markCommit}
          state={state}
        />
        <CommitList
          bisectShas={bisectShas}
          commits={commitListInDescendingOrder}
          isGoodBySha={isGoodBySha}
          onCommitClick={actions.selectCommit}
        />
      </div>
    );
  }
}
