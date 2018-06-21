/** @format */

/**
 * External dependencies
 */

import { omit, reduce } from 'lodash';

/**
 * Internal dependencies
 */
import { NOTICE_CREATE, NOTICE_REMOVE, ROUTE_SET } from 'state/action-types';
import { combineReducers, createReducer } from 'state/utils';

export const items = createReducer(
	{},
	{
		[ NOTICE_CREATE ]: ( state, action ) => {
			const { notice } = action;
			if ( 'production' !== process.env.NODE_ENV ) {
				// Falsy values `null`, `undefined`, `false`, `''` aren't acceptable.
				// Falsy `0` should be valid.
				if ( ! notice.noticeId && 0 !== notice.noticeId ) {
					throw new TypeError(
						`Expected valid noticeId but found: ${ JSON.stringify( notice.noticeId ) }`
					);
				}
			}
			return {
				...state,
				[ notice.noticeId ]: notice,
			};
		},
		[ NOTICE_REMOVE ]: ( state, action ) => {
			const { noticeId } = action;
			if ( ! state.hasOwnProperty( noticeId ) ) {
				return state;
			}

			return omit( state, noticeId );
		},
		[ ROUTE_SET ]: state => {
			return reduce(
				state,
				( memo, notice, noticeId ) => {
					if ( ! notice.isPersistent && ! notice.displayOnNextPage ) {
						return memo;
					}

					let nextNotice = notice;
					if ( nextNotice.displayOnNextPage ) {
						nextNotice = {
							...nextNotice,
							displayOnNextPage: false,
						};
					}

					memo[ noticeId ] = nextNotice;
					return memo;
				},
				{}
			);
		},
	}
);

export const lastTimeShown = createReducer(
	{},
	{
		[ NOTICE_CREATE ]: ( state, action ) => {
			const { notice } = action;
			return {
				...state,
				[ notice.noticeId ]: Date.now(),
			};
		},
	}
);

export default combineReducers( {
	items,
	lastTimeShown,
} );
