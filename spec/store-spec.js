'use babel';

import {
  Bisect as BisectConstants,
  State as StateConstants
} from '../lib/constants';
import store from '../lib/store';

describe('store', () => {
  const mocks = {
    commitList: [
      { sha: 7 },
      { sha: 6 },
      { sha: 5 },
      { sha: 4 },
      { sha: 3 },
      { sha: 2 },
      { sha: 1 },
      { sha: 0 }
    ]
  };
  const mockRepoPath = '/home/whatever/some-repo/';
  const mockGit = {};

  describe(StateConstants.INIT, () => {
    it(`can transition to ${StateConstants.GIT_INITIALIZED}`, () => {
      store.resetState();
      expect(store.getState().state).toBe(StateConstants.INIT);
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      expect(store.getState().state).toBe(StateConstants.GIT_INITIALIZED);
      expect(store.getState().repoPath).toBe(mockRepoPath);
      expect(store.getState().git).toBe(mockGit);
    });
  });

  describe(StateConstants.GIT_INITIALIZED, () => {
    it(`can transition to ${StateConstants.COMMIT_LIST_LOADING}`, () => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });

      expect(store.getState().state).toBe(StateConstants.GIT_INITIALIZED);
      store.move(StateConstants.COMMIT_LIST_LOADING);
      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_LOADING);
    });
  });

  describe(StateConstants.COMMIT_LIST_LOADING, () => {
    it(`can transition to ${StateConstants.COMMIT_LIST_SHOWN}`, () => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_LOADING);

      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().commitListInDescendingOrder).toEqual(mocks.commitList);
    });
  });

  describe(StateConstants.COMMIT_LIST_SHOWN, () => {
    it(`can transition to ${StateConstants.COMMIT_1_SELECTED}`, () => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);
      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().bisectShas.temp).toBe(null);

      store.move(StateConstants.COMMIT_1_SELECTED, { sha: 6 });

      expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
      expect(store.getState().bisectShas.temp).toBe(6);
    });
  });

  describe(StateConstants.COMMIT_1_SELECTED, () => {
    it(`can transition to ${StateConstants.COMMIT_LIST_SHOWN}`, () => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);
      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
      store.move(StateConstants.COMMIT_1_SELECTED, { sha: 6 });

      expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
      expect(store.getState().bisectShas.temp).toBe(6);

      store.move(StateConstants.COMMIT_LIST_SHOWN);

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().bisectShas.temp).toBe(null);
    });

    describe(`can transition to ${StateConstants.COMMIT_2_SELECTED}`, () => {
      it('where the selected commit is older than the stored commit', () => {
        store.resetState();
        store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
        store.move(StateConstants.COMMIT_LIST_LOADING);
        store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
        store.move(StateConstants.COMMIT_1_SELECTED, { sha: 6 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
        expect(store.getState().bisectShas.temp).toBe(6);

        store.move(StateConstants.COMMIT_2_SELECTED, { sha: 2 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_2_SELECTED);
        expect(store.getState().bisectShas.temp).toBe(null);
        expect(store.getState().bisectShas.begin).toBe(2);
        expect(store.getState().bisectShas.end).toBe(6);
      });

      it('where the second commit is younger than the stored commit', () => {
        store.resetState();
        store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
        store.move(StateConstants.COMMIT_LIST_LOADING);
        store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
        store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
        expect(store.getState().bisectShas.temp).toBe(1);

        store.move(StateConstants.COMMIT_2_SELECTED, { sha: 5 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_2_SELECTED);
        expect(store.getState().bisectShas.temp).toBe(null);
        expect(store.getState().bisectShas.begin).toBe(1);
        expect(store.getState().bisectShas.end).toBe(5);
      });
    });
  });

  describe(StateConstants.COMMIT_2_SELECTED, () => {
    beforeEach(() => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);
      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
      store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });
      store.move(StateConstants.COMMIT_2_SELECTED, { sha: 5 });

      expect(store.getState().state).toBe(StateConstants.COMMIT_2_SELECTED);
      expect(store.getState().bisectShas.begin).toBe(1);
      expect(store.getState().bisectShas.end).toBe(5);
    });

    it(`can transition to ${StateConstants.COMMIT_LIST_SHOWN}`, () => {
      store.move(StateConstants.COMMIT_LIST_SHOWN);

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().bisectShas.begin).toBe(null);
      expect(store.getState().bisectShas.end).toBe(null);
    });

    describe(`can transition to ${StateConstants.COMMIT_1_SELECTED}`, () => {
      it('when the deselected commit is begin', () => {
        store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
        expect(store.getState().bisectShas.begin).toBe(null);
        expect(store.getState().bisectShas.end).toBe(null);
        expect(store.getState().bisectShas.temp).toBe(5);
      });

      it('when the deselected commit is end', () => {
        store.move(StateConstants.COMMIT_1_SELECTED, { sha: 5 });

        expect(store.getState().state).toBe(StateConstants.COMMIT_1_SELECTED);
        expect(store.getState().bisectShas.begin).toBe(null);
        expect(store.getState().bisectShas.end).toBe(null);
        expect(store.getState().bisectShas.temp).toBe(1);
      });
    });

    it(`can transition to ${StateConstants.BISECT_CHECKOUT_TRIGGERED}`, () => {
      store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);

      expect(store.getState().state).toBe(StateConstants.BISECT_CHECKOUT_TRIGGERED);
      expect(store.getState().isGoodBySha).toEqual({
        1: BisectConstants.commitState.GOOD,
        2: BisectConstants.commitState.UNKNOWN,
        3: BisectConstants.commitState.UNKNOWN,
        4: BisectConstants.commitState.UNKNOWN,
        5: BisectConstants.commitState.BAD
      });
    });
  });

  describe(StateConstants.BISECT_CHECKOUT_TRIGGERED, () => {
    beforeEach(() => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);
      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
      store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });
      store.move(StateConstants.COMMIT_2_SELECTED, { sha: 4 });
      store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);

      expect(store.getState().state).toBe(StateConstants.BISECT_CHECKOUT_TRIGGERED);
      expect(store.getState().bisectShas.begin).toBe(1);
      expect(store.getState().bisectShas.end).toBe(4);
      expect(store.getState().isGoodBySha).toEqual({
        1: BisectConstants.commitState.GOOD,
        2: BisectConstants.commitState.UNKNOWN,
        3: BisectConstants.commitState.UNKNOWN,
        4: BisectConstants.commitState.BAD
      });
    });

    it(`can transition to ${StateConstants.COMMIT_LIST_SHOWN}`, () => {
      store.move(StateConstants.COMMIT_LIST_SHOWN);

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().bisectShas).toEqual({
        begin: null,
        current: null,
        end: null,
        temp: null
      });
      expect(store.getState().isGoodBySha).toEqual({});
    });

    it(`can transition to ${StateConstants.BISECT_COMMIT_CHECKED_OUT}`, () => {
      store.move(StateConstants.BISECT_COMMIT_CHECKED_OUT, { sha: 2 });

      expect(store.getState().state).toBe(StateConstants.BISECT_COMMIT_CHECKED_OUT);
      expect(store.getState().bisectShas.begin).toBe(1);
      expect(store.getState().bisectShas.current).toBe(2);
      expect(store.getState().bisectShas.end).toBe(4);
      expect(store.getState().isGoodBySha).toEqual({
        1: BisectConstants.commitState.GOOD,
        2: BisectConstants.commitState.UNKNOWN,
        3: BisectConstants.commitState.UNKNOWN,
        4: BisectConstants.commitState.BAD
      });
    });

    it(`can transition to ${StateConstants.BISECT_COMPLETED}`, () => {
      const prevState = store.getState();

      store.move(StateConstants.BISECT_COMPLETED);

      expect(store.getState()).toEqual({
        ...prevState,
        state: StateConstants.BISECT_COMPLETED
      });
    });
  });

  describe(StateConstants.BISECT_COMMIT_CHECKED_OUT, () => {
    beforeEach(() => {
      store.resetState();
      store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
      store.move(StateConstants.COMMIT_LIST_LOADING);
      store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
      store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });
      store.move(StateConstants.COMMIT_2_SELECTED, { sha: 6 });
      store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);
      store.move(StateConstants.BISECT_COMMIT_CHECKED_OUT, { sha: 3 });

      expect(store.getState().state).toBe(StateConstants.BISECT_COMMIT_CHECKED_OUT);
      expect(store.getState().bisectShas.begin).toBe(1);
      expect(store.getState().bisectShas.current).toBe(3);
      expect(store.getState().bisectShas.end).toBe(6);
      expect(store.getState().isGoodBySha).toEqual({
        1: BisectConstants.commitState.GOOD,
        2: BisectConstants.commitState.UNKNOWN,
        3: BisectConstants.commitState.UNKNOWN,
        4: BisectConstants.commitState.UNKNOWN,
        5: BisectConstants.commitState.UNKNOWN,
        6: BisectConstants.commitState.BAD
      });
    });

    it(`can transition to ${StateConstants.COMMIT_LIST_SHOWN}`, () => {
      store.move(StateConstants.COMMIT_LIST_SHOWN);

      expect(store.getState().state).toBe(StateConstants.COMMIT_LIST_SHOWN);
      expect(store.getState().bisectShas).toEqual({
        begin: null,
        current: null,
        end: null,
        temp: null
      });
      expect(store.getState().isGoodBySha).toEqual({});
    });

    describe(`can transition to ${StateConstants.BISECT_CHECKOUT_TRIGGERED}`, () => {
      it('when the commit was bad', () => {
        store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED, { isGood: false });

        expect(store.getState().state).toBe(StateConstants.BISECT_CHECKOUT_TRIGGERED);
        expect(store.getState().bisectShas.begin).toBe(1);
        expect(store.getState().bisectShas.current).toBe(null);
        expect(store.getState().bisectShas.end).toBe(6);
        expect(store.getState().isGoodBySha).toEqual({
          1: BisectConstants.commitState.GOOD,
          2: BisectConstants.commitState.UNKNOWN,
          3: BisectConstants.commitState.BAD,
          4: BisectConstants.commitState.BAD,
          5: BisectConstants.commitState.BAD,
          6: BisectConstants.commitState.BAD
        });
      });

      it('when the commit was good', () => {
        store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED, { isGood: true });

        expect(store.getState().state).toBe(StateConstants.BISECT_CHECKOUT_TRIGGERED);
        expect(store.getState().bisectShas.begin).toBe(1);
        expect(store.getState().bisectShas.current).toBe(null);
        expect(store.getState().bisectShas.end).toBe(6);
        expect(store.getState().isGoodBySha).toEqual({
          1: BisectConstants.commitState.GOOD,
          2: BisectConstants.commitState.GOOD,
          3: BisectConstants.commitState.GOOD,
          4: BisectConstants.commitState.UNKNOWN,
          5: BisectConstants.commitState.UNKNOWN,
          6: BisectConstants.commitState.BAD
        });
      });
    });

    describe(StateConstants.BISECT_COMPLETED, () => {
      it(`can transition to ${StateConstants.COMMIT_LIST_LOADING}`, () => {
        store.resetState();
        store.move(StateConstants.GIT_INITIALIZED, { git: mockGit, repoPath: mockRepoPath });
        store.move(StateConstants.COMMIT_LIST_LOADING);
        store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList: mocks.commitList });
        store.move(StateConstants.COMMIT_1_SELECTED, { sha: 1 });
        store.move(StateConstants.COMMIT_2_SELECTED, { sha: 4 });
        store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);
        store.move(StateConstants.BISECT_COMPLETED);

        expect(store.getState().state).toBe(StateConstants.BISECT_COMPLETED);
        expect(store.getState().bisectShas.begin).toBe(1);
        expect(store.getState().bisectShas.end).toBe(4);
        expect(store.getState().isGoodBySha).toEqual({
          1: BisectConstants.commitState.GOOD,
          2: BisectConstants.commitState.UNKNOWN,
          3: BisectConstants.commitState.UNKNOWN,
          4: BisectConstants.commitState.BAD
        });

        store.move(StateConstants.COMMIT_LIST_LOADING);

        const state = store.getState();

        store.resetState();

        expect(state).toEqual({
          ...store.getState(),
          state: StateConstants.COMMIT_LIST_LOADING
        });
      });
    });
  });
});
