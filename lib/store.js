'use babel';

import EventEmitter from 'events';
import R, { __ } from 'ramda';

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
  commitListInDescendingOrder: [],
  commitNodeBySha: {},
  repoPath: null
});

const resetStatePath = path => R.assocPath(path, R.path(path, init()));

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
        R.assoc(['commitListInDescendingOrder'], commitList),
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
      // TODO make this graph aware!
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
      // TODO make this graph aware!
      const isGoodBySha = R.pipe(
        R.splitWhen(R.propEq('sha', prevState.bisectShas.end)),
        R.last,
        R.splitWhen(R.propEq('sha', prevState.bisectShas.begin)),
        ([commitsInRange, [splitCommit]]) => [...commitsInRange, splitCommit],
        ([first, ...commitsInRange]) => {
          const middle = R.init(commitsInRange);
          const last = R.last(commitsInRange);
          return [
            [first.sha, BisectConstants.commitState.BAD],
            ...R.map(({ sha }) => [sha, BisectConstants.commitState.UNKNOWN], middle),
            [last.sha, BisectConstants.commitState.GOOD]
          ];
        },
        R.fromPairs
      )(prevState.commitListInDescendingOrder);

      return R.assoc('isGoodBySha', isGoodBySha, prevState);
    }
  },
  [StateConstants.BISECT_CHECKOUT_TRIGGERED]: {
    // cancel bisecting
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha'])
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
      resetStatePath(['isGoodBySha'])
    ),
    // flag selected commit and any derivable commits as good/bad
    [StateConstants.BISECT_CHECKOUT_TRIGGERED]: (prevState, { isGood }) => {
      const commitOrder = R.filter(
        R.propSatisfies(R.has(__, prevState.isGoodBySha), 'sha'),
        prevState.commitListInDescendingOrder
      );
      const [newerCommits, [currentCommit, ...olderCommits]] = R.splitWhen(
        R.propEq('sha', prevState.bisectShas.current),
        commitOrder
      );

      return R.pipe(
        R.assocPath(['bisectShas', 'current'], null),
        R.assoc('isGoodBySha', {
          ...prevState.isGoodBySha,
          ...R.pipe(
            R.append(currentCommit),
            R.indexBy(R.prop('sha')),
            R.map(R.always(isGood ? BisectConstants.commitState.GOOD : BisectConstants.commitState.BAD))
          )(isGood ? olderCommits : newerCommits)
        })
      )(prevState);
    }
  },
  [StateConstants.BISECT_COMPLETED]: {
    [StateConstants.COMMIT_LIST_SHOWN]: R.pipe(
      resetStatePath(['bisectShas']),
      resetStatePath(['isGoodBySha'])
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
