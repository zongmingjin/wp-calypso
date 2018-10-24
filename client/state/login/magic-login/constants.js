/** @format */

/**
 * Internal dependencies
 */
import config from 'config';

export const AUTHENTICATE_URL = config( 'login_url' ) + '?action=magic-login';
export const CHECK_YOUR_EMAIL_PAGE = 'CHECK_YOUR_EMAIL_PAGE';
export const LINK_EXPIRED_PAGE = 'LINK_EXPIRED_PAGE';
export const REQUEST_FORM = 'REQUEST_FORM';
export const INTERSTITIAL_PAGE = 'INTERSTITIAL_PAGE';
