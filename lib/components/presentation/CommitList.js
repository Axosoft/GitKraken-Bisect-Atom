'use babel';

import React, { Component } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import R from 'ramda';

import Commit from './Commit';

const isCommitSelected = (sha, bisectShas) =>
  sha === bisectShas.temp || sha === bisectShas.begin || sha === bisectShas.end;

const makeFindIndexOfCurrentSha = () => {
  let prevCommitList = [];
  let prevSha = null;
  let prevIndex = null;

  return (sha, commitList) => {
    if (sha === prevSha && commitList === prevCommitList) {
      return prevIndex;
    }

    prevCommitList = commitList;
    prevSha = sha;

    const result = R.findIndex(R.propEq('sha', sha), commitList);

    prevIndex = result === -1 ? null : result;
    return prevIndex;
  };
};
const findIndexOfCurrentSha = makeFindIndexOfCurrentSha();

const shallowEqual = (a, b) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
};

class CommitList extends Component {
  state = { currentShaIndex: null, hasScrolled: true };

  static getDerivedStateFromProps(props, state) {
    const currentShaIndex = findIndexOfCurrentSha(props.bisectShas.current, props.commits);

    return state.currentShaIndex === currentShaIndex
      ? null
      : { currentShaIndex, hasScrolled: false };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }

  componentDidUpdate(prevProps, { hasScrolled }) {
    if (!hasScrolled) {
      this.setState({ hasScrolled: true });
    }
  }

  render() {
    const {
      props: { bisectShas, commits, isGoodBySha, onCommitClick },
      state: { currentShaIndex, hasScrolled }
    } = this;

    return (
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
                scrollToIndex={hasScrolled ? null : currentShaIndex}
                tabIndex={null}
                width={width}
              />
            </div>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default CommitList;
