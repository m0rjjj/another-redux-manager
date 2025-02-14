import { makeReducerMethods } from './defaultReducerMethods';
import axios from 'axios';
import { fetchTypes } from './constants';

const OPTIONS_LIST = [
  { actionName: 'initial', actionTypePostFix: 'FETCH_INITIAL' },
  { actionName: 'inProgress', actionTypePostFix: 'FETCH_IN_PROGRESS' },
  { actionName: 'success', actionTypePostFix: 'FETCH_SUCCESS' },
  { actionName: 'failure', actionTypePostFix: 'FETCH_FAILED' }
];

/*
  Exports dynamically generated actions and action creators for use in async data fetching. This cuts down the boilerplate code required.

  Usage:
  const contentReduxManager = createReduxManager({name: 'CONTENT', resultsPropsName: 'results' }, 'payload');

  Exports the following:
  const { initial, inProgress, success, failure} = contentReduxManager; // actionCreators
  const { CONTENT_FETCH_INITIAL, CONTENT_FETCH_IN_PROGRESS, CONTENT_FETCH_SUCCESS, CONTENT_FETCH_FAILED } = contentReduxManager.actionTypeKeys; // plain action types
  const { initial, inProgress, success, failure} = reducerMethods; // reducer methods

*/

const DEFAULT_RESULTS_PROP_NAME = 'results';

const defaultLogger = () => {
  return {
    error: (error, message) => {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  };
};

/*
  Reducers boiler plate by providing a configurable axios fetch call.
 */
const fetch = props => {
  if (!props || (props && !props.query)) {
    return Promise.reject('Missing Config Parameters For Fetch');
  }

  const { query, name, logger = defaultLogger(), logData, config = {}, type = 'GET' } = props;

  const axiosCall =
    type == fetchTypes.POST
      ? axios.post
      : type == fetchTypes.PUT
      ? axios.put
      : type == fetchTypes.PATCH
      ? axios.patch
      : type == fetchTypes.DELETE
      ? axios.delete
      : axios.get;

  return axiosCall(query, config)
    .then(response => {
      return response.data;
    })
    .catch(err => {
      logger.error(
        { err, ...(logData && { logData }) },
        name ? `Fetch ${name} Failed` : `Fetch Failed`
      );
      return Promise.reject(err);
    });
};

const createReduxManager = ({
  name,
  resultsPropName = DEFAULT_RESULTS_PROP_NAME,
  reducerMethods = makeReducerMethods,
  argNames = ['payload']
}) =>
  OPTIONS_LIST.reduce(
    (acc, option) => {
      acc.actionTypeKeys[
        `${name}_${option.actionTypePostFix}`
      ] = `${name}_${option.actionTypePostFix}`;

      acc.actionTypes[option.actionName] = name + '_' + option.actionTypePostFix;

      acc.actions = {};
      acc.actions[option.actionName] = (...args) =>
        argNames.reduce(
          (acc2, argName, index) => {
            if (args[index]) {
              acc2[argNames[index]] = args[index];
            }
            return acc2;
          },
          { type: `${name}_${option.actionTypePostFix}` }
        );

      // Short hand for easier reading when composing actions.
      acc[option.actionName] = acc.actions[option.actionName];

      acc.name = name;
      acc.reducerMethods = reducerMethods(acc, resultsPropName);
      acc.fetch = fetch;

      return acc;
    },
    {
      actionTypes: {},
      actionTypeKeys: {},
      name: ''
    }
  );

/*
  Essentially returns and action creator
  usage:

  const ADD_TODO = 'ADD_TODO'
  export const addTodo = makeActionCreator(ADD_TODO, 'text')
*/

const makeActionCreator = (type, ...argNames) => {
  return function(...args) {
    const action = { type };
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index];
    });
    return action;
  };
};

export { makeActionCreator, createReduxManager };
