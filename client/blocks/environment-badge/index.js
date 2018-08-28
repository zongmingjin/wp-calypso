/** @format */
/**
 * External dependencies
 */
import React from 'react';
import config from 'config';
import Gridicon from 'gridicons';
import { get } from 'lodash';
// import { execSync } from 'child_process';

/**
 * Internal dependencies
 */
import ExternalLink from 'components/external-link';
import EnvironmentBadge, {
	TestHelper,
	Branch,
	DevDocsLink,
	PreferencesHelper,
} from 'components/environment-badge';

// function getCurrentBranchName() {
// 	try {
// 		return execSync( 'git rev-parse --abbrev-ref HEAD' )
// 			.toString()
// 			.replace( /\s/gm, '' );
// 	} catch ( err ) {
// 		console.log( err.message );
// 		return undefined;
// 	}
// }

// function getCurrentCommitShortChecksum() {
// 	try {
// 		return execSync( 'git rev-parse --short HEAD' )
// 			.toString()
// 			.replace( /\s/gm, '' );
// 	} catch ( err ) {
// 		console.log( err.message );
// 		return undefined;
// 	}
// }

const getEnvironmentProps = env =>
	get(
		{
			wpcalypso: {
				badge: 'wpcalypso',
				devDocs: true,
				feedbackURL: 'https://github.com/Automattic/wp-calypso/issues/',
				faviconURL: '/calypso/images/favicons/favicon-wpcalypso.ico',
			},

			horizon: {
				badge: 'feedback',
				feedbackURL: 'https://horizonfeedback.wordpress.com/',
				faviconURL: '/calypso/images/favicons/favicon-horizon.ico',
			},

			stage: {
				badge: 'staging',
				feedbackURL: 'https://github.com/Automattic/wp-calypso/issues/',
				faviconURL: '/calypso/images/favicons/favicon-staging.ico',
			},

			development: {
				badge: 'dev',
				devDocs: true,
				feedbackURL: 'https://github.com/Automattic/wp-calypso/issues/',
				faviconURL: '/calypso/images/favicons/favicon-development.ico',
				// branchName: getCurrentBranchName(),
				// commitChecksum: getCurrentCommitShortChecksum(),
			},
		},
		env,
		{}
	);

const devDocsURL = '/devdocs';

const Badge = () => {
	const calypsoEnv = config( 'env_id' );
	const abTestHelper = config.isEnabled( 'dev/test-helper' );
	const preferencesHelper = config.isEnabled( 'dev/preferences-helper' );

	const { badge, branchName, commitChecksum, devDocs, feedbackURL } = getEnvironmentProps(
		calypsoEnv
	);

	if ( ! badge ) {
		return null;
	}

	return config.isEnabled( 'desktop' ) ? (
		<EnvironmentBadge badge={ badge } feedbackURL={ feedbackURL }>
			{ preferencesHelper && <PreferencesHelper /> }
			{ abTestHelper && <TestHelper /> }
			{ branchName && <Branch branchName={ branchName } commitChecksum={ commitChecksum } /> }
			{ devDocs && <DevDocsLink url={ devDocsURL } /> }
		</EnvironmentBadge>
	) : (
		<div className="environment-badge">
			{ abTestHelper && <div className="environment is-tests" /> }
			{ branchName &&
				branchName !== 'master' && (
					<span className="environment branch-name" title={ 'Commit ' + commitChecksum }>
						{ branchName }
					</span>
				) }
			{ devDocs && (
				<span className="environment is-docs">
					<a href={ devDocsURL } title="DevDocs">
						docs
					</a>
				</span>
			) }
			<span className={ `environment is-${ badge } is-env` }>{ badge }</span>
			<ExternalLink
				className="bug-report"
				href={ feedbackURL }
				target="_blank"
				title="Report an issue"
			>
				<Gridicon icon="bug" size={ 18 } />
			</ExternalLink>
		</div>
	);
};

export default Badge;
