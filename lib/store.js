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

const getShasInRange = (head, isInRangeBySha, walkDirection) => {
  const nextNodesKey = walkDirection === BisectConstants.walkDirection.DOWN
    ? 'parents'
    : 'children';
  const unknownShasInRange = {};

  let nextNode = head;

  while (nextNode && isInRangeBySha[nextNode.commit.sha]) {
    unknownShasInRange[nextNode.commit.sha] = true;

    const nextNodes = nextNode[nextNodesKey];

    if (nextNodes.length === 0) {
      break;
    }
    if (nextNodes.length === 1) {
      nextNode = nextNodes[0];
    } else {
      return R.reduce(
        (unknownShasInRange, next) => R.merge(
          unknownShasInRange,
          getShasInRange(next, isInRangeBySha, walkDirection)
        ),
        unknownShasInRange,
        nextNodes
      );
    }
  }

  return unknownShasInRange;
};

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
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: (prevState) => {
      const { bisectShas: { begin, end }, commitNodeBySha } = prevState;

      const isInSelectionRangeBySha = {
        [end]: true,
        [begin]: true
      };

      let nextNode = R.prop(end, commitNodeBySha);
      while (nextNode && nextNode.commit.sha !== begin) {
        isInSelectionRangeBySha[nextNode.commit.sha] = true;
        nextNode = nextNode.next;
      }

      const unknownShas = R.map(
        R.always(BisectConstants.commitState.UNKNOWN),
        getShasInRange(R.prop(end, commitNodeBySha), isInSelectionRangeBySha, BisectConstants.walkDirection.DOWN)
      );

      const isGoodBySha = {
        ...unknownShas,
        [end]: BisectConstants.commitState.BAD,
        [begin]: BisectConstants.commitState.GOOD
      };

      return R.pipe(
        R.assoc('isGoodBySha', isGoodBySha),
        R.assoc('isInSelectionRangeBySha', isInSelectionRangeBySha)
      )(prevState);
    }
  },
  [StateConstants.BISECT_CHECKOUT_TRIGGERED]: {
    // cancel bisecting
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha']),
      resetStatePath(['isInSelectionRangeBySha'])
    ),
    // finished checking out first commit in bisect
    [StateConstants.BISECT_COMMIT_CHECKED_OUT]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'current'], sha, prevState),

    [StateConstants.BISECT_COMPLETED]: (prevState, { sha }) =>
      R.assocPath(['bisectShas', 'found'], sha, prevState)
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
      let updatedShas;

      if (isGood) {
        updatedShas = R.map(
          R.always(BisectConstants.commitState.GOOD),
          getShasInRange(R.prop(current, commitNodeBySha), isInSelectionRangeBySha, BisectConstants.walkDirection.DOWN)
        );
      } else {
        updatedShas = R.map(
          R.always(BisectConstants.commitState.BAD),
          getShasInRange(R.prop(current, commitNodeBySha), isInSelectionRangeBySha, BisectConstants.walkDirection.UP)
        );
      }

      return R.pipe(
        resetStatePath(['bisectShas', 'current']),
        R.assoc('isGoodBySha', {
          ...isGoodBySha,
          ...updatedShas
        })
      )(prevState);
    }
  },
  [StateConstants.BISECT_COMPLETED]: {
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
