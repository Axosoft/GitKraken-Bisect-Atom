'use babel';

import store from '../store';
import { State as StateConstants } from '../constants';

export default (sha) => {
  const { bisectShas, state } = store.getState();

  switch (state) {
    case StateConstants.COMMIT_LIST_SHOWN:
      store.move(StateConstants.COMMIT_1_SELECTED, { sha });
      break;

    case StateConstants.COMMIT_1_SELECTED:
      if (sha === bisectShas.temp) {
        store.move(StateConstants.COMMIT_LIST_SHOWN);
      } else {
        store.move(StateConstants.COMMIT_2_SELECTED, { sha });
      }
      break;

    case StateConstants.COMMIT_2_SELECTED:
      if (sha === bisectShas.begin || sha === bisectShas.end) {
        store.move(StateConstants.COMMIT_1_SELECTED, { sha });
      }
      break;

    case StateConstants.BISECT_CLARIFY_COMMIT_SELECTION:
      if (sha === bisectShas.begin || sha === bisectShas.end) {
        store.move(StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED, { goodSha: sha });
      }
      break;

    case StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED:
      if (sha === bisectShas.end) {
        store.move(StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED);
      }
      break;

    default:
      break;
  }
};
