'use babel';

import React from 'react';
import R from 'ramda';
import { AutoSizer, List } from 'react-virtualized';

import Commit from './Commit';

const CommitList = ({ commits }) => (
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
