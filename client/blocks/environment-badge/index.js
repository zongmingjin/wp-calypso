/** @format */
/**
 * External dependencies
 */
import react from 'react';
import config from 'config';
import Gridicon from 'gridicons';

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

const EnvironmentBadge = ( {
	abTestHelper,
	badge,
	branchName,
	commitChecksum,
	devDocs,
	devDocsURL,
	feedbackURL,
	preferencesHelper,
} ) => {
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
