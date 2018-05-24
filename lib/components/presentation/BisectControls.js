'use babel';

import React from 'react';
import R, { __ } from 'ramda';

import { State as StateConstants } from '../../constants';

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
    <span>Checking out</span>
    <span className='loading loading-spinner-small' />
  </div>
);

const BeginBisectPrompt = ({ onBegin, onCancel }) => (
  <div style={HEADER_STYLE}>
    <button className='btn btn-primary' onClick={onBegin}>Begin Bisect</button>
    <button className='btn' onClick={onCancel}>Cancel</button>
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

    case StateConstants.BISECT_COMMIT_CHECKED_OUT: return <div />;

    case StateConstants.BISECT_COMPLETED: return <div />;

    default: return <div />;
  }
};

export default BisectControls;
