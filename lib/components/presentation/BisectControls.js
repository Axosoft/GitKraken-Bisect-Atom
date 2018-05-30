'use babel';

import React from 'react';

import { State as StateConstants } from '../../constants';

const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '50px'
};

const SelectCommit = ({ numberToSelect, onCancel }) => (
  <div style={HEADER_STYLE}>
    <span>Please select {numberToSelect} commit{numberToSelect === 1 || 's'}</span>
    {numberToSelect === 2 || <button className='btn' onClick={onCancel} style={{ marginLeft: 5 }}>Cancel</button>}
  </div>
);

const CheckingOut = () => (
  <div style={HEADER_STYLE}>
    <span>Checking out commit</span>
    <span className='loading loading-spinner-small' />
  </div>
);

const BeginBisectPrompt = ({ onBegin, onCancel }) => (
  <div style={HEADER_STYLE}>
    <button className='btn btn-primary' onClick={onBegin}>Begin Bisect</button>
    <button className='btn' onClick={onCancel}>Cancel</button>
  </div>
);

const MarkCommitPrompt = ({ onMarkCommit, onCancel }) => (
  <div style={HEADER_STYLE}>
    <button
      className='btn btn-success'
      onClick={() => onMarkCommit(true)}
    >
      Good
    </button>
    <button
      className='btn btn-error'
      onClick={() => onMarkCommit(false)}
    >
      Bad
    </button>
    <button className='btn' onClick={onCancel}>
      Cancel
    </button>
  </div>
);

const BisectComplete = ({ isRange, onComplete }) => (
  <div style={HEADER_STYLE}>
    <span>{isRange ? 'Bug was fixed in this range' : 'Bad commit found'}</span>
    <button className='btn' onClick={onComplete} style={{ marginLeft: 5 }}>Clear Bisect</button>
  </div>
);

const SelectGoodCommit = ({ onCancel }) => (
  <div style={HEADER_STYLE}>
    <span>Select the good commit</span>
    <button className='btn' onClick={onCancel} style={{ marginLeft: 5 }}>Cancel</button>
  </div>
);

const ContinueBisect = ({ onBegin, onCancel }) => (
  <div style={HEADER_STYLE}>
    <button
      className='btn btn-primary'
      onClick={onBegin}
    >
      Accept & Begin Bisect
    </button>
    <button className='btn' onClick={onCancel}>
      Cancel
    </button>
  </div>
);

const BisectControls = ({ state, ...props }) => {
  switch (state) {
    case StateConstants.COMMIT_LIST_SHOWN:
      return <SelectCommit {...props} numberToSelect={2} />;

    case StateConstants.COMMIT_1_SELECTED:
      return <SelectCommit {...props} numberToSelect={1} />;

    case StateConstants.COMMIT_2_SELECTED:
      return <BeginBisectPrompt {...props} />;

    case StateConstants.BISECT_CLARIFY_COMMIT_SELECTION:
      return <SelectGoodCommit {...props} />;

    case StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED:
      return <ContinueBisect {...props} />;

    case StateConstants.BISECT_CHECKOUT_TRIGGERED:
    case StateConstants.BISECT_SHAS_CALCULATED:
    case StateConstants.BISECT_STARTED:
      return <CheckingOut />;

    case StateConstants.BISECT_REACHED_MERGE_BASE:
    case StateConstants.BISECT_COMMIT_CHECKED_OUT:
      return <MarkCommitPrompt {...props} />;

    case StateConstants.BISECT_COMPLETED_RANGE:
      return <BisectComplete {...props} isRange />;

    case StateConstants.BISECT_COMPLETED_SINGLE:
      return <BisectComplete {...props} />;

    default: return <div style={HEADER_STYLE} />;
  }
};

export default BisectControls;
