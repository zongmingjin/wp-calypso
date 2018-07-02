/** @format */

/**
 * External dependencies
 */

import url from 'url';
import { moment } from 'i18n-calypso';
import { isEmpty, toLower, trim, trimEnd } from 'lodash';
import striptags from 'striptags';

/**
 * Internal dependencies
 */
import postNormalizer from 'lib/post-normalizer';

export const getEditURL = function( post, site ) {
	if ( ! site ) {
		return '/post';
	}

	if ( ! post ) {
		return `/post/${ site.slug }`;
	}

	let path;

	const type = post.type || 'post';
	switch ( type ) {
		case 'post':
			path = '/post';
			break;
		case 'page':
			path = '/page';
			break;
		default:
			path = `/edit/${ type }`;
			break;
	}

	path += `/${ site.slug }`;

	if ( post.ID ) {
		path += `/${ post.ID }`;
	}

	return path;
};

export const getPreviewURL = function( site, post, autosavePreviewUrl ) {
	let parsed, previewUrl;

	if ( ! post || ! post.URL || post.status === 'trash' ) {
		return '';
	}

	if ( autosavePreviewUrl ) {
		previewUrl = autosavePreviewUrl;
	} else if ( post.status === 'publish' ) {
		previewUrl = post.URL;
	} else {
		parsed = url.parse( post.URL, true );
		parsed.query.preview = 'true';
		delete parsed.search;
		previewUrl = url.format( parsed );
	}

	if ( post.site_ID ) {
		if ( ! ( site && site.options ) ) {
			// site info is still loading, just use what we already have until it does
			return previewUrl;
		}
		if ( site.options.is_mapped_domain ) {
			previewUrl = previewUrl.replace( site.URL, site.options.unmapped_url );
		}
		if ( site.options.frame_nonce ) {
			parsed = url.parse( previewUrl, true );
			parsed.query[ 'frame-nonce' ] = site.options.frame_nonce;
			delete parsed.search;
			previewUrl = url.format( parsed );
		}
	}

	return previewUrl;
};

export const userCan = function( capability, post ) {
	const hasCap = post.capabilities && post.capabilities[ capability ];

	if ( capability === 'edit_post' ) {
		return hasCap && post.status !== 'trash';
	}

	return hasCap;
};

// Return backdated-published status of a post. Optionally, the `status` can be overridden
// with a custom value: what would the post status be if a `status` edit was applied?
export const isBackDatedPublished = function( post, status ) {
	if ( ! post ) {
		return false;
	}

	const effectiveStatus = status || post.status;

	return effectiveStatus === 'future' && moment( post.date ).isBefore( moment() );
};

// Return published status of a post. Optionally, the `status` can be overridden
// with a custom value: what would the post status be if a `status` edit was applied?
export const isPublished = function( post, status ) {
	if ( ! post ) {
		return false;
	}

	const effectiveStatus = status || post.status;

	return (
		effectiveStatus === 'publish' ||
		effectiveStatus === 'private' ||
		isBackDatedPublished( post, status )
	);
};

export const isScheduled = function( post ) {
	if ( ! post ) {
		return false;
	}

	return post.status === 'future';
};

export const isPrivate = function( post ) {
	if ( ! post ) {
		return false;
	}

	return post.status === 'private';
};

export const isPending = function( post ) {
	if ( ! post ) {
		return false;
	}

	return post.status === 'pending';
};

export const getEditedTime = function( post ) {
	if ( ! post ) {
		return;
	}

	if ( post.status === 'publish' || post.status === 'future' ) {
		return post.date;
	}

	return post.modified;
};

export const isFutureDated = function( post ) {
	if ( ! post ) {
		return false;
	}

	const oneMinute = 1000 * 60;

	return post && +new Date() + oneMinute < +new Date( post.date );
};

export const isBackDated = function( post ) {
	if ( ! post || ! post.date || ! post.modified ) {
		return false;
	}

	return moment( post.date ).isBefore( moment( post.modified ) );
};

export const isPage = function( post ) {
	if ( ! post ) {
		return false;
	}

	return post && 'page' === post.type;
};

export const normalizeSync = function( post, callback ) {
	const imageWidth = 653;
	postNormalizer(
		post,
		[
			postNormalizer.decodeEntities,
			postNormalizer.stripHTML,
			postNormalizer.safeImageProperties( imageWidth ),
			postNormalizer.withContentDOM( [
				postNormalizer.content.removeStyles,
				postNormalizer.content.makeImagesSafe( imageWidth ),
				postNormalizer.content.detectMedia,
			] ),
			postNormalizer.pickCanonicalImage,
		],
		callback
	);
};

export const getVisibility = function( post ) {
	if ( ! post ) {
		return null;
	}

	if ( post.password ) {
		return 'password';
	}

	if ( 'private' === post.status ) {
		return 'private';
	}

	return 'public';
};

export const normalizeAsync = function( post, callback ) {
	postNormalizer( post, [ postNormalizer.keepValidImages( 72, 72 ) ], callback );
};

export const removeSlug = function( path ) {
	if ( ! path ) {
		return;
	}

	const pathParts = path.slice( 0, -1 ).split( '/' );
	pathParts[ pathParts.length - 1 ] = '';

	return pathParts.join( '/' );
};

export const getPermalinkBasePath = function( post ) {
	if ( ! post ) {
		return;
	}

	let path = post.URL;

	// if we have a permalink_URL, utlize that
	if ( ! isPublished( post ) && post.other_URLs && post.other_URLs.permalink_URL ) {
		path = post.other_URLs.permalink_URL;
	}

	return removeSlug( path );
};

export const getPagePath = function( post ) {
	if ( ! post ) {
		return;
	}
	if ( ! isPublished( post ) ) {
		return getPermalinkBasePath( post );
	}

	return removeSlug( post.URL );
};

/**
 * Returns the ID of the featured image assigned to the specified post, or
 * `undefined` otherwise. A utility function is useful because the format
 * of a post varies between the retrieve and update endpoints. When
 * retrieving a post, the thumbnail ID is assigned in `post_thumbnail`, but
 * in creating a post, the thumbnail ID is assigned to `featured_image`.
 *
 * @param  {Object} post Post object
 * @returns {*} featured image id or undefined
 */
export const getFeaturedImageId = function( post ) {
	if ( ! post ) {
		return;
	}

	if ( 'featured_image' in post && ! /^https?:\/\//.test( post.featured_image ) ) {
		// Return the `featured_image` property if it does not appear to be
		// formatted as a URL
		return post.featured_image;
	}

	if ( post.post_thumbnail ) {
		// After the initial load from the REST API, pull the numeric ID
		// from the thumbnail object if one exists
		return post.post_thumbnail.ID;
	}
};

/**
 * Return date with timezone offset.
 * If `date` is not defined it returns `now`.
 *
 * @param {String|Date} date - date
 * @param {String} tz - timezone
 * @return {Moment} moment instance
 */
export const getOffsetDate = function( date, tz ) {
	if ( ! tz ) {
		return moment( date );
	}

	return moment( moment.tz( date, tz ) );
};

export function sanitizeTitleWithDashes( title, context = 'display' ) {
	title = trim( title );

	if ( isEmpty( title ) ) {
		return '';
	}

	title = striptags( title );

	// Preserve escaped octets.
	title = title.replace( /%([a-fA-F0-9]{2})/g, '---$1---' );

	// Remove percent signs that are not part of an octet.
	title = title.replace( /%/g, '' );

	// Restore octets.
	title = title.replace( /---([a-fA-F0-9]{2})---/g, '%$1' );

	// @TODO properly handle UTF-8 & other multibyte chars
	title = toLower( title );

	if ( 'save' === context ) {
		// Convert nbsp, ndash and mdash to hyphens
		title = title.replace( /[\xa0\u2013\u2014]/g, '-' );

		// Convert nbsp, ndash and mdash HTML entities to hyphens
		title = title.replace( /&(nbsp|#160|ndash|#8211|mdash|#8212);/g, '-' );

		// Convert forward slash to hyphen
		title = title.replace( /\//g, '-' );

		// Strip these characters entirely:
		const charStripRegExp = new RegExp(
			'[' +
				[
					'\xa1', // iexcl / Inverted Exclamation Mark
					'\xbf', // iquest / Inverted Question Mark
					'\xab', // left-pointing double angle quotation mark
					'\xbb', // right-pointing double angle quotation mark
					'\u2039', // single left-pointing angle quotation mark
					'\u203a', // single left-pointing angle quotation mark
					'\u2018',
					'\u2019',
					'\u201c', // ldquo / left double-quotation mark
					'\u201d', // rdquo / right double-quotation mark
					/* @TODO
						// curly quotes
				done:		'%e2%80%98', '%e2%80%99', '%e2%80%9c', '%e2%80%9d',
						'%e2%80%9a', '%e2%80%9b', '%e2%80%9e', '%e2%80%9f',
						// copy, reg, deg, hellip and trade
						'%c2%a9', '%c2%ae', '%c2%b0', '%e2%80%a6', '%e2%84%a2',
						// acute accents
						'%c2%b4', '%cb%8a', '%cc%81', '%cd%81',
						// grave accent, macron, caron
						'%cc%80', '%cc%84', '%cc%8c',
						*/
				].join() +
				']',
			'g'
		);
		title = title.replace( charStripRegExp, '' );

		// Convert times / multiplication sign to x
		title = title.replace( /\xd7/g, 'x' );
	}

	// kill entities
	title = title.replace( /&.+?;/g, '' );

	// Convert periods to dashes
	title = title.replace( /\./g, '-' );

	title = title.replace( /[^%a-z0-9 _-]/, '' );

	// Collapse whitespace to a single dash
	title = title.replace( /\s+/g, '-' );

	title = title.replace( /-+/g, '-' );

	// Don't end in a dash
	title = trimEnd( title, '-' );

	return title;
}
