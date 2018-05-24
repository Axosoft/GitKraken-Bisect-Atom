'use babel';

import React from 'react';

import {
  Bisect as BisectConstants,
  State as StateConstants
} from '../../constants';

const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '50px'
};

const SelectCommit = ({ numberToSelect }) => (
  <div style={HEADER_STYLE}>
    Please select {numberToSelect} commit{numberToSelect === 1 || 's'}
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
      onClick={() => onMarkCommit(BisectConstants.commitState.GOOD)}
    >
      Good
    </button>
    <button
      className='btn btn-error'
      onClick={() => onMarkCommit(BisectConstants.commitState.BAD)}
    >
      Bad
    </button>
    <button className='btn' onClick={onCancel}>
      Cancel
    </button>
  </div>
);

const BisectComplete = ({ onComplete }) => (
  <div style={HEADER_STYLE}>
    <span>Bisect finished</span>
    <button className='btn' onClick={onComplete}>Reset State</button>
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

    case StateConstants.BISECT_CHECKOUT_TRIGGERED:
      return <CheckingOut />;

    case StateConstants.BISECT_COMMIT_CHECKED_OUT:
      return <MarkCommitPrompt {...props} />;

    case StateConstants.BISECT_COMPLETED:
      return <BisectComplete {...props} />;

    default: return <div />;
  }
};

export default BisectControls;
