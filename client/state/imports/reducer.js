/** @format */
/**
 * External dependencies
 */
import { omit } from 'lodash';
import { createReducer, combineReducers } from 'state/utils';
import {
	// IMPORTS_AUTHORS_SET_MAPPING,
	IMPORTS_AUTHORS_START_MAPPING,
	IMPORTS_FETCH,
	IMPORTS_FETCH_FAILED,
	IMPORTS_FETCH_COMPLETED,
	IMPORTS_IMPORT_CANCEL,
	IMPORTS_IMPORT_LOCK,
	IMPORTS_IMPORT_RECEIVE,
	IMPORTS_IMPORT_RESET,
	IMPORTS_IMPORT_START,
	// IMPORTS_IMPORT_UNLOCK,
	IMPORTS_START_IMPORTING,
	// IMPORTS_STORE_RESET,
	IMPORTS_UPLOAD_FAILED,
	IMPORTS_UPLOAD_COMPLETED,
	IMPORTS_UPLOAD_SET_PROGRESS,
	IMPORTS_UPLOAD_START,
} from 'state/action-types';
import { appStates } from 'state/imports/constants';

const rejectItem = ( state, { importerId } ) => omit( state, importerId );

const isFetching = createReducer( false, {
	[ IMPORTS_FETCH ]: () => true,
	[ IMPORTS_FETCH_FAILED ]: () => false,
} );

const isHydrated = createReducer( false, {
	[ IMPORTS_IMPORT_RECEIVE ]: () => true,
	[ IMPORTS_FETCH_COMPLETED ]: () => true,
} );

const retryCount = createReducer( 0, {
	[ IMPORTS_FETCH_FAILED ]: state => state + 1,
	[ IMPORTS_FETCH_COMPLETED ]: () => 0,
} );

const importerState = createReducer(
	{},
	{
		[ IMPORTS_UPLOAD_START ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: appStates.UPLOADING,
		} ),
		// the names IMPORTS_START_IMPORTING, IMPORTS_UPLOAD_START are too similar
		[ IMPORTS_IMPORT_START ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: appStates.READY_FOR_UPLOAD,
		} ),

		[ IMPORTS_START_IMPORTING ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: appStates.IMPORTING,
		} ),

		[ IMPORTS_UPLOAD_FAILED ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: appStates.UPLOAD_FAILURE,
		} ),

		[ IMPORTS_AUTHORS_START_MAPPING ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: appStates.MAP_AUTHORS,
		} ),

		[ IMPORTS_IMPORT_RECEIVE ]: ( state, action ) => ( {
			...state,
			[ action.importerStatus.importerId ]: action.importerStatus.importerState,
		} ),

		[ IMPORTS_UPLOAD_COMPLETED ]: rejectItem,
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

const percentComplete = createReducer(
	{},
	{
		[ IMPORTS_UPLOAD_SET_PROGRESS ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]:
				( action.uploadLoaded / ( action.uploadTotal + Number.EPSILON ) ) * 100,
		} ),
		// Do we ever need to set to 0 on start?
		[ IMPORTS_UPLOAD_COMPLETED ]: rejectItem,
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

const lockedImports = createReducer(
	{},
	{
		[ IMPORTS_IMPORT_LOCK ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: true,
		} ),
		[ IMPORTS_IMPORT_LOCK ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: false,
		} ),
	}
);

const filename = createReducer(
	{},
	{
		[ IMPORTS_UPLOAD_START ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: action.filename,
		} ),
		[ IMPORTS_UPLOAD_COMPLETED ]: rejectItem,
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

const errors = createReducer(
	{},
	{
		[ IMPORTS_UPLOAD_FAILED ]: ( state, action ) => ( {
			...state,
			[ action.importerId ]: {
				type: 'uploadError',
				description: action.error,
			},
		} ),

		[ IMPORTS_UPLOAD_COMPLETED ]: rejectItem,
		[ IMPORTS_UPLOAD_COMPLETED ]: rejectItem,
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

export default combineReducers( {
	isFetching,
	isHydrated,
	importerState,
	percentComplete,
	lockedImports,
	filename,
	errors,
	retryCount,
} );
