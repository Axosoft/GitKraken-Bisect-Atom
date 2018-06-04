'use babel';

import classnames from 'classnames';
import React from 'react';

import store from '../../store';
import actions from '../../actions';
import { Atom as AtomConstants, State as StateConstants } from '../../constants';
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

    actions.queued.initialize()
      .catch((e) => {
        atom.notifications.addError(e.message || e);

        const paneItem = atom.workspace.getPaneItems()
          .find(item => item.getURI && item.getURI() === AtomConstants.GITKRAKEN_BISECT_URI);

        if (paneItem) {
          paneItem.destroy();
        }
      });
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
      hasGitKraken,
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
      'highlight-commits': state === StateConstants.BISECT_CHECKOUT_TRIGGERED
        || state === StateConstants.BISECT_COMMIT_CHECKED_OUT
        || state === StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED
        || state === StateConstants.BISECT_COMPLETED_RANGE
        || state === StateConstants.BISECT_COMPLETED_SINGLE
        || state === StateConstants.BISECT_REACHED_MERGE_BASE
        || state === StateConstants.BISECT_SHAS_CALCULATED,
      'needs-clarification': state === StateConstants.BISECT_CLARIFY_COMMIT_SELECTION
    });

    return (
      <div className={classes} style={GIT_BISECT_CONTAINER_STYLE}>
        <BisectControls
          hasGitKraken={hasGitKraken}
          onBegin={actions.queued.beginBisect}
          onCancel={actions.queued.cancel}
          onComplete={actions.queued.finishBisect}
          onMarkCommit={actions.queued.markCommit}
          onOpenGitKraken={actions.unsafe.openGitKraken}
          state={state}
        />
        <CommitList
          bisectShas={bisectShas}
          commits={commitListInDescendingOrder}
          isGoodBySha={isGoodBySha}
          onCommitClick={actions.queued.selectCommit}
        />
      </div>
    );
  }
}
