'use babel';

import React from 'react';
import R from 'ramda';
import { AutoSizer, List } from 'react-virtualized';

import Commit from './Commit';

const isCommitSelected = (sha, bisectShas) =>
  sha === bisectShas.temp || sha === bisectShas.begin || sha === bisectShas.end;

const CommitList = ({ bisectShas, commits, onCommitClick }) => (
  <div style={{ flexGrow: 1 }}>
    <AutoSizer>
      {({ height, width }) => (
        <div style={{ height, width }}>
          <List
            height={height}
            overscanRowCount={0}
            rowCount={commits.length}
            rowHeight={50}
            rowRenderer={({ index, style }) => (
              <Commit
                key={commits[index].sha}
                commit={commits[index]}
                isSelected={isCommitSelected(commits[index].sha, bisectShas)}
                onClick={onCommitClick}
                style={style}
              />
            )}
            tabIndex={null}
            width={width}
          />
        </div>
      )}
    </AutoSizer>
  </div>
);

export default CommitList;
