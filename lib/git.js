'use babel';

import moment from 'moment';

const now = moment();

const mockLog = [
  {
    sha: 0,
    parents: [1],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 1,
    parents: [2],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 2,
    parents: [3],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 3,
    parents: [4, 5],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 4,
    parents: [6],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 5,
    parents: [7],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 6,
    parents: [8],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 7,
    parents: [9],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 8,
    parents: [10],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 9,
    parents: [10],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 10,
    parents: [11],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 11,
    parents: [12],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'hi mom',
    description: ''
  },
  {
    sha: 12,
    parents: [13],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: '',
    description: ''
  },
  {
    sha: 13,
    parents: [],
    author: 'Tyler Ang-Wanek <tylerw@axosoft.com>',
    date: now.subtract(1, 'minute').format(),
    summary: 'initial commit',
    description: ''
  }
];

const mockBisect = {
  mark: (sha, flag) => Promise.resolve(bisect),
  cancel: () => Promise.resolve()
};

export default {
  log: () => Promise.resolve(mockLog),
  bisect: () => Promise.resolve(bisect)
};
