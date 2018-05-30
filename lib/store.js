'use babel';

import EventEmitter from 'events';
import R from 'ramda';

import {
  Bisect as BisectConstants,
  State as StateConstants
} from './constants';

const init = () => ({
  bisectShas: {
    begin: null,
    current: null,
    end: null,
    found: null,
    temp: null
  },
  git: null,
  isGoodBySha: {},
  isInSelectionRangeBySha: {},
  commitListInDescendingOrder: [],
  commitNodeBySha: {},
  repoPath: null
});

const resetStatePath = path => R.assocPath(path, R.path(path, init()));

const makeGetNextNodes = direction => R.prop(
  direction === BisectConstants.walkDirection.DOWN
    ? 'parents'
    : 'children'
);

const getReachableShasInRange = (head, isInRangeBySha, direction) => {
  const getNextNodes = makeGetNextNodes(direction);
  const walkNext = (node) => {
    if (!isInRangeBySha[node.commit.sha]) {
      return {};
    }

    const nextNodes = getNextNodes(node);

    switch (nextNodes.length) {
      case 0:
        return {
          [node.commit.sha]: true
        };

      case 1:
        return R.pipe(
          walkNext,
          R.assoc(node.commit.sha, true)
        )(nextNodes[0]);

      default:
        return R.pipe(
          R.map(walkNext),
          R.mergeAll,
          R.assoc(node.commit.sha, true)
        )(nextNodes);
    }
  };

  return walkNext(head);
};

const findAllNodesThatReachTarget = (head, isInRangeBySha, direction, targetSha) => {
  const getNextNodes = makeGetNextNodes(direction);
  const walkNext = (node) => {
    if (!isInRangeBySha[node.commit.sha]) {
      return null;
    }

    if (node.commit.sha === targetSha) {
      return {
        [targetSha]: true
      };
    }

    const nextNodes = getNextNodes(node);

    switch (nextNodes.length) {
      case 0: {
        return null;
      }
      case 1: {
        const walkResult = walkNext(nextNodes[0]);
        if (walkResult) {
          walkResult[node.commit.sha] = true;
        }
        return walkResult;
      }
      default: {
        const branchWalkResults = R.pipe(
          R.map(walkNext),
          R.filter(Boolean)
        )(nextNodes);

        if (!branchWalkResults.length) {
          return null;
        }

        const walkResult = R.mergeAll(branchWalkResults);

        walkResult[node.commit.sha] = true;

        return walkResult;
      }
    }
  };

  return walkNext(head);
};

const getIsInSelectionRangeBySha = (begin, end, commitNodeBySha) => {
  const isInSelectionRangeBySha = {
    [end]: true,
    [begin]: true
  };

  let nextNode = R.prop(end, commitNodeBySha);
  while (nextNode && nextNode.commit.sha !== begin) {
    isInSelectionRangeBySha[nextNode.commit.sha] = true;
    nextNode = nextNode.next;
  }

  return isInSelectionRangeBySha;
};

const buildShaMapToStatus = R.curry(
  (headCommitNode, range, direction, status) =>
    R.map(R.always(status), getReachableShasInRange(headCommitNode, range, direction))
);

const stateTransitions = {
  [StateConstants.INIT]: {
    [StateConstants.GIT_INITIALIZED]: (state, { git, repoPath }) => R.pipe(
      R.assoc('git', git),
      R.assoc('repoPath', repoPath)
    )(state)
  },
  [StateConstants.GIT_INITIALIZED]: {
    [StateConstants.COMMIT_LIST_LOADING]: R.identity
  },
  [StateConstants.COMMIT_LIST_LOADING]: {
    [StateConstants.COMMIT_LIST_SHOWN]: (prevState, { commitList, nodeBySha }) =>
      R.pipe(
        R.assoc('commitListInDescendingOrder', commitList),
        R.assoc('commitNodeBySha', nodeBySha)
      )(prevState)
  },
  [StateConstants.COMMIT_LIST_SHOWN]: {
    [StateConstants.COMMIT_1_SELECTED]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'temp'], sha, prevState)
  },
  [StateConstants.COMMIT_1_SELECTED]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.assocPath(['bisectShas', 'temp'], null),
    [StateConstants.COMMIT_2_SELECTED]: (prevState, { sha }) => {
      const indexOfStoredSha = R.findIndex(
        R.propEq('sha', prevState.bisectShas.temp),
        prevState.commitListInDescendingOrder
      );
      const indexOfParameterSha = R.findIndex(
        R.propEq('sha', sha),
        prevState.commitListInDescendingOrder
      );

      if (indexOfStoredSha === indexOfParameterSha) {
        throw new Error('UI should not allow the same commit to be selected');
      }

      let begin;
      let end;
      if (indexOfStoredSha < indexOfParameterSha) {
        begin = sha;
        end = prevState.bisectShas.temp;
      } else {
        begin = prevState.bisectShas.temp;
        end = sha;
      }

      return R.pipe(
        R.assocPath(['bisectShas', 'begin'], begin),
        R.assocPath(['bisectShas', 'end'], end),
        resetStatePath(['bisectShas', 'temp'])
      )(prevState);
    }
  },
  [StateConstants.COMMIT_2_SELECTED]: {
    // cancel selections
    [StateConstants.COMMIT_LIST_SHOWN]: resetStatePath(['bisectShas']),
    // unselect one of the commits
    [StateConstants.COMMIT_1_SELECTED]: (prevState, { sha }) => {
      const temp = sha === prevState.bisectShas.begin
        ? prevState.bisectShas.end
        : prevState.bisectShas.begin;

      return R.pipe(
        resetStatePath(['bisectShas', 'begin']),
        resetStatePath(['bisectShas', 'end']),
        R.assocPath(['bisectShas', 'temp'], temp)
      )(prevState);
    },
    // Start bisecting
    [StateConstants.BISECT_STARTED]: (prevState) => {
      const { bisectShas: { begin, end } } = prevState;

      return R.assoc('isGoodBySha', {
        [end]: BisectConstants.commitState.UNKNOWN,
        [begin]: BisectConstants.commitState.UNKNOWN
      }, prevState);
    }
  },
  [StateConstants.BISECT_STARTED]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: (prevState) => {
      const { bisectShas: { begin, end } } = prevState;

      return R.assoc('isGoodBySha', {
        [end]: BisectConstants.commitState.BAD,
        [begin]: BisectConstants.commitState.GOOD
      }, prevState);
    },
    [StateConstants.BISECT_CLARIFY_COMMIT_SELECTION]: R.identity,
  },
  [StateConstants.BISECT_CHECKOUT_TRIGGERED]: {
    // cancel bisecting
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    [StateConstants.BISECT_SHAS_CALCULATED]: (prevState, { shas }) => {
      const { isGoodBySha } = prevState;
      const isInSelectionRangeBySha = R.pipe(
        R.map(sha => [sha, true]),
        R.fromPairs
      )(shas);

      return R.pipe(
        R.assoc('isInSelectionRangeBySha', isInSelectionRangeBySha),
        R.assoc('isGoodBySha', {
          ...R.map(R.always(BisectConstants.commitState.UNKNOWN), isInSelectionRangeBySha),
          ...isGoodBySha
        })
      )(prevState);
    },
    // finished checking out first commit in bisect
    [StateConstants.BISECT_COMMIT_CHECKED_OUT]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'current'], sha, prevState),
    [StateConstants.BISECT_REACHED_MERGE_BASE]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'current'], sha, prevState),
    [StateConstants.BISECT_COMPLETED_SINGLE]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'found'], sha, prevState),
    [StateConstants.BISECT_COMPLETED_RANGE]: (prevState, { shas: { good, bad } }) => {
      const { commitNodeBySha } = prevState;
      const isInSelectionRangeBySha = getIsInSelectionRangeBySha(bad, good, commitNodeBySha);
      const nodesFromBeginToEnd = findAllNodesThatReachTarget(
        commitNodeBySha[good],
        isInSelectionRangeBySha,
        BisectConstants.walkDirection.DOWN,
        bad
      );

      return R.pipe(
        resetStatePath(['bisectShas']),
        R.assocPath(['bisectShas', 'foundSha'], '0000000000000000000000000000000000000000'),
        R.assoc('isInSelectionRangeBySha', isInSelectionRangeBySha),
        R.assoc('isGoodBySha', {
          ...R.map(R.always(BisectConstants.commitState.UNKNOWN), nodesFromBeginToEnd),
          [bad]: BisectConstants.commitState.BAD,
          [good]: BisectConstants.commitState.GOOD
        })
      )(prevState);
    }
  },
  [StateConstants.BISECT_CLARIFY_COMMIT_SELECTION]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    [StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED]: (prevState, { goodSha }) => {
      const {
        bisectShas: { begin, end },
        isGoodBySha
      } = prevState;

      if (begin === goodSha) {
        return R.assoc('isGoodBySha', {
          ...isGoodBySha,
          [end]: BisectConstants.commitState.BAD,
          [begin]: BisectConstants.commitState.GOOD
        }, prevState);
      }

      return R.pipe(
        R.assocPath(['bisectShas', 'begin'], end),
        R.assocPath(['bisectShas', 'end'], begin),
        R.assoc('isGoodBySha', {
          ...isGoodBySha,
          [end]: BisectConstants.commitState.GOOD,
          [begin]: BisectConstants.commitState.BAD
        })
      )(prevState);
    }
  },
  [StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    [StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED]: (prevState) => {
      const {
        bisectShas: { begin, end },
        isGoodBySha
      } = prevState;
      return R.pipe(
        R.assocPath(['bisectShas', 'begin'], end),
        R.assocPath(['bisectShas', 'end'], begin),
        R.assoc('isGoodBySha', {
          ...isGoodBySha,
          [end]: BisectConstants.commitState.GOOD,
          [begin]: BisectConstants.commitState.BAD
        })
      )(prevState);
    },
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: R.identity
  },
  [StateConstants.BISECT_SHAS_CALCULATED]: {
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: R.identity
  },
  [StateConstants.BISECT_COMMIT_CHECKED_OUT]: {
    // cancel bisecting
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    // flag selected commit and any derivable commits as good/bad
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: (prevState, { isGood }) => {
      const { bisectShas: { current }, commitNodeBySha, isGoodBySha, isInSelectionRangeBySha } = prevState;
      const getUpdatedShas = buildShaMapToStatus(commitNodeBySha[current], isInSelectionRangeBySha);
      const updatedShas = isGood
        ? getUpdatedShas(BisectConstants.walkDirection.DOWN, BisectConstants.commitState.GOOD)
        : getUpdatedShas(BisectConstants.walkDirection.UP, BisectConstants.commitState.BAD);

      return R.pipe(
        resetStatePath(['bisectShas', 'current']),
        R.assoc('isGoodBySha', {
          ...isGoodBySha,
          ...updatedShas
        })
      )(prevState);
    }
  },
  [StateConstants.BISECT_REACHED_MERGE_BASE]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: (prevState, { isGood }) => {
      const {
        bisectShas: { current },
        isGoodBySha
      } = prevState;

      const nextIsGoodBySha = {
        ...isGoodBySha,
        [current]: isGood
          ? BisectConstants.commitState.GOOD
          : BisectConstants.commitState.BAD
      };

      return R.pipe(
        resetStatePath(['bisectShas', 'current']),
        R.assocPath(['bisectShas', 'begin'], current),
        R.assoc('isGoodBySha', nextIsGoodBySha)
      )(prevState);
    }
  },
  [StateConstants.BISECT_COMPLETED_SINGLE]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    )
  },
  [StateConstants.BISECT_COMPLETED_RANGE]: { // TODO
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    )
  }
};

let store;
export default new (class Store extends EventEmitter {
  constructor() {
    super();
    this.resetState();
  }

  getState = () => store;

  move = (requestedState, payload) => {
    if (!R.has(requestedState, StateConstants)) {
      throw new Error(`Requested state, ${requestedState}, must be defined in StateConstants.`);
    }

    if (payload !== undefined && !R.is(Object, payload)) {
      throw new Error('Payload parameter must be an object.');
    }

    const legalTransitions = stateTransitions[store.state];
    if (!R.has(requestedState, legalTransitions)) {
      throw new Error(`Requested state, ${requestedState}, must have a transition method in ${store.state}.`);
    }

    const transitionFn = legalTransitions[requestedState];
    if (!R.is(Function, transitionFn)) {
      throw new Error(`${requestedState} does not have a valid function defined as its value.`);
    }

    store = {
      ...transitionFn(store, payload),
      state: requestedState
    };
    this.emit('transition', store);
  };

  resetState = () => {
    store = {
      ...init(),
      state: StateConstants.INIT
    };
  };
})();
