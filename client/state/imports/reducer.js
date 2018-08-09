/** @format */
/**
 * External dependencies
 */
import { get, includes, omit, omitBy } from 'lodash';
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

const importerStatus = createReducer(
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

// TODO: It's likely this will be redundant, remove it.
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
		[ IMPORTS_IMPORT_LOCK ]: ( state, action ) => console.log( action ) || ( {
			...state,
			[ action.importerId ]: true,
		} ),
		[ IMPORTS_IMPORT_LOCK ]: ( state, action ) => console.log( action ) || ( {
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
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

// maybe rename
const mainData = createReducer(
	{},
	{
		[ IMPORTS_UPLOAD_COMPLETED ]: ( state, action ) => console.log( action ) || ( {
			...rejectItem( state, action ),
			[ action.importerStatus.importerId ]: action.importerStatus,
		} ),
		[ IMPORTS_AUTHORS_START_MAPPING ]: ( state, action ) => {
			const importerData = get( state, action.importerId, {} );
			const authors = get( state, [ action.importerId, 'customData.sourceAuthors' ], [] );

			console.log( action )

			return {
				...state,
				[ action.importerId ]: {
					...importerData,
					customData: {
						...importerData.customData,
						sourceAuthors: authors.map(
							author =>
								action.sourceAuthor.id === get( author, 'id', null )
									? {
											...author,
											mappedTo: action.targetAuthor,
									  }
									: author
						),
					},
				},
			};
		},
		[ IMPORTS_IMPORT_RECEIVE ]: ( state, action ) => {
			console.log( action, action.isLocked );
			// isLocked comes from getState
			return action.isLocked
				? state
				: omitBy(
						{
							...state,
							[ action.importerStatus.importerId ]: action.importerStatus,
						},
						importer =>
							includes( [ appStates.CANCEL_PENDING, appStates.DEFUNCT ], importer.importerState )
				  );
		},
		[ IMPORTS_UPLOAD_SET_PROGRESS ]: ( state, action ) => console.log( action ) || ( {
			...state,
			[ action.importerId ]: {
				// Get the original data and only update the progress
				...get( state, action.importerId, {} ),
				progress: ( action.uploadLoaded / ( action.uploadTotal + Number.EPSILON ) ) * 100,
			},
		} ),
		[ IMPORTS_IMPORT_START ]: ( state, action ) => console.log( action ) || ( {
			...state,
			[ action.importerId ]: {
				importerId: action.importerId,
				type: action.importerType,
				importerState: appStates.READY_FOR_UPLOAD,
				site: { ID: action.siteId },
			},
		} ),
		[ IMPORTS_IMPORT_CANCEL ]: rejectItem,
		[ IMPORTS_IMPORT_RESET ]: rejectItem,
	}
);

export default combineReducers( {
	mainData,
	isFetching,
	isHydrated,
	importerStatus,
	percentComplete,
	lockedImports,
	filename,
	errors,
	retryCount,
} );
