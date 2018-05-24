'use babel';

import React from 'react';
import gravatar from 'gravatar';
import memoize from 'lodash.memoize';
import classnames from 'classnames';

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

const Commit = ({ commit, isSelected, onClick, style }) => (
  <div onClick={() => onClick(commit.sha)} style={style}>
    <div className={classnames('commit-row', { 'commit-row-selected': isSelected })} style={COMMIT_ROW_STYLE}>
      <img height='30' width='30' src={getGravatarUrl('tylerw@axosoft.com')} />
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

export default Commit;
