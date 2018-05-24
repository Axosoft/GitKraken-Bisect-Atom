'use babel';

import R, { __ } from 'ramda';

import { State as StateConstants } from '../constants';
import store from '../store';

const unlink = (node) => {
  const { next, prev } = node;
  prev.next = next;
  next.prev = prev;
  node.next = null;
  node.prev = null;
  return next;
};

const link = (prev, node) => {
  const { next } = prev;
  prev.next = node;
  node.prev = prev;
  node.next = next;
  next.prev = node;
};

const move = (child, node) => {
  const next = unlink(node);
  link(child, node);
  return next;
};

// correct for topological defects as we walk
function* fixTopologyWalk(mutableListHead) {
  let node = mutableListHead;
  while (node) {
    if (node.children.length === 0) {
      node.yielded = true;
      yield node.commit;
      node = node.next;
      continue;
    }

    // ensure all children of this commit have been yielded, otherwise, move the node to an unyielded child
    let next = node;
    for (const child of node.children) {
      if (!child.yielded) {
        next = move(child, node);
        break;
      }
    }

    if (next === node) {
      node.yielded = true;
      yield node.commit;
      node = node.next;
    }
  }
}

export default async () => {
  if (store.getState().state !== StateConstants.GIT_INITIALIZED) {
    return;
  }

  store.move(StateConstants.COMMIT_LIST_LOADING);

  const makeNode = () => ({ children: [], commit: null, parents: [], next: null, prev: null });
  const { git } = store.getState();
  const log = await git.log();

  // generates linked list and lookup table
  const { head, nodeBySha } = R.reduce(
    (acc, commit) => {
      if (!acc.nodeBySha[commit.sha]) {
        acc.nodeBySha[commit.sha] = makeNode();
      }

      acc.nodeBySha = R.reduce(
        (_nodeBySha, parentSha) => {
          if (!_nodeBySha[parentSha]) {
            _nodeBySha[parentSha] = makeNode();
          }
          _nodeBySha[parentSha].children.push(_nodeBySha[commit.sha]);
          return _nodeBySha;
        },
        acc.nodeBySha,
        commit.parents
      );

      acc.nodeBySha[commit.sha].parents = R.map(R.prop(__, acc.nodeBySha), commit.parents);
      acc.nodeBySha[commit.sha].commit = commit;

      if (!acc.previous) {
        return {
          nodeBySha: acc.nodeBySha,
          previous: acc.nodeBySha[commit.sha],
          head: acc.nodeBySha[commit.sha]
        };
      }

      acc.nodeBySha[commit.sha].prev = acc.previous;
      acc.nodeBySha[acc.previous.commit.sha].next = acc.nodeBySha[commit.sha];

      return R.assoc('previous', acc.nodeBySha[commit.sha], acc);
    },
    {
      nodeBySha: {},
      head: null,
      previous: null
    },
    log
  );

  store.move(StateConstants.COMMIT_LIST_SHOWN, {
    commitList: [...fixTopologyWalk(head)],
    nodeBySha
  });
};
