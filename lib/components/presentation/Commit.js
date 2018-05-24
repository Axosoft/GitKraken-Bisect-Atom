'use babel';

import React, { PureComponent } from 'react';
import gravatar from 'gravatar';
import memoize from 'lodash.memoize';
import classnames from 'classnames';

import { Bisect as BisectConstants } from '../../constants';

const COMMIT_ROW_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '2px',
  padding: '6px',
  cursor: 'pointer'
};

const COMMIT_INFO_STYLE = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  marginLeft: '6px',
  maxWidth: 'calc(100% - 30px - 6px)'
};

const COMMIT_TOP_ROW_STYLE = {
  display: 'flex'
};

const SUMMARY_STYLE = {
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flexGrow: 1
};

const SHA_STYLE = {
  fontFamily: 'monospace',
  maxWidth: '56px',
  minWidth: '56px'
};

const COMMIT_SIGNATURE_STYLE = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const getGravatarUrl = memoize(email => gravatar.url(email, {
  d: 'retro',
  s: '60',
  protocol: 'https'
}));

const getCommitRowClassName = (isSelected, status) => classnames(
  'commit-row',
  {
    'commit-row-selected': isSelected,
    'commit-row-bad': status === BisectConstants.commitState.BAD,
    'commit-row-good': status === BisectConstants.commitState.GOOD,
    'commit-row-unknown': status === BisectConstants.commitState.UNKNOWN
  }
);

export default class Commit extends PureComponent {
  render() {
    const { commit, isSelected, onClick, status, style } = this.props;

    return (
      <div onClick={() => onClick(commit.sha)} style={style}>
        <div className={getCommitRowClassName(isSelected, status)} style={COMMIT_ROW_STYLE}>
          <img height='30' width='30' src={getGravatarUrl(commit.email)} />
          <div style={COMMIT_INFO_STYLE}>
            <div style={COMMIT_TOP_ROW_STYLE}>
              <span style={SUMMARY_STYLE}>{commit.summary}</span>
              <span style={SHA_STYLE}>{commit.sha}</span>
            </div>
            <div style={COMMIT_SIGNATURE_STYLE}>{commit.date} by {commit.author}</div>
          </div>
        </div>
      </div>
    );
  }
}
