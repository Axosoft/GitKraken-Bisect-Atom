'use babel';

import React from 'react';
import { AutoSizer, List } from 'react-virtualized';

import Commit from './Commit';

const isCommitSelected = (sha, bisectShas) =>
  sha === bisectShas.temp || sha === bisectShas.begin || sha === bisectShas.end;

const CommitList = ({ bisectShas, commits, isGoodBySha, onCommitClick }) => (
  <div style={{ flexGrow: 1 }}>
    <AutoSizer>
      {({ height, width }) => (
        <div style={{ height, width }}>
          <List
            height={height}
            overscanRowCount={10}
            rowCount={commits.length}
            rowHeight={50}
            rowRenderer={({ index, style }) => (
              <Commit
                key={commits[index].sha}
                commit={commits[index]}
                isCurrent={commits[index].sha === bisectShas.current}
                isFoundSha={bisectShas.found}
                isSelected={isCommitSelected(commits[index].sha, bisectShas)}
                onClick={onCommitClick}
                status={isGoodBySha[commits[index].sha]}
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
