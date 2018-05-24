'use babel';

import React from 'react';
import gravatar from 'gravatar';

const GRAVATAR_OPTIONS = {
  d: 'retro',
  s: '60',
  protocol: 'https'
};

const COMMIT_ROW_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: 'rgb(62, 66, 78)',
  margin: '2px',
  padding: '6px',
  cursor: 'pointer'
};

const COMMIT_INFO_STYLE = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  marginLeft: '6px'
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

const Commit = ({ commit, style }) => (
  <div style={style}>
    <div style={COMMIT_ROW_STYLE}>
      <img height='30' width='30' src={gravatar.url('tylerw@axosoft.com', GRAVATAR_OPTIONS)} />
      <div style={COMMIT_INFO_STYLE}>
        <div style={COMMIT_TOP_ROW_STYLE}>
          <div style={SUMMARY_STYLE}>{commit.summary}</div>
          <div style={SHA_STYLE}>{commit.sha}</div>
        </div>
        <div style={COMMIT_SIGNATURE_STYLE}>{commit.date} by {commit.author}</div>
      </div>
    </div>
  </div>
);

export default Commit;
