/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import notices from 'notices';
import { connect } from 'react-redux';
import { get, includes, isString, omit, partial, pickBy, noop } from 'lodash';
import { localize } from 'i18n-calypso';
import SocialLogo from 'social-logos';

/**
 * Internal dependencies
 */
import ExternalLink from 'components/external-link';
import Card from 'components/card';
import SupportInfo from 'components/support-info';
import FormInput from 'components/forms/form-text-input-with-affixes';
import FormInputValidation from 'components/forms/form-input-validation';
import FormFieldset from 'components/forms/form-fieldset';
import JetpackModuleToggle from 'my-sites/site-settings/jetpack-module-toggle';
import QueryJetpackModules from 'components/data/query-jetpack-modules';
import QuerySiteSettings from 'components/data/query-site-settings';
import SectionHeader from 'components/section-header';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';
import isJetpackModuleActive from 'state/selectors/is-jetpack-module-active';
import { isJetpackMinimumVersion, isJetpackSite } from 'state/sites/selectors';
import {
	isSiteSettingsSaveSuccessful,
	getSiteSettingsSaveError,
} from 'state/site-settings/selectors';
import { recordTracksEvent } from 'state/analytics/actions';
import { requestSite } from 'state/sites/actions';
import { requestSiteSettings, saveSiteSettings } from 'state/site-settings/actions';
import { protectForm } from 'lib/protect-form';
import FoldableCard from 'components/foldable-card';
import Button from '../../../components/button';

class SiteVerification extends Component {
	static serviceIds = {
		google: 'google-site-verification',
		bing: 'msvalidate.01',
		pinterest: 'p:domain_verify',
		yandex: 'yandex-verification',
	};

	state = {
		...this.stateForSite( this.props.site ),
		dirtyFields: new Set(),
		invalidatedSiteObject: this.props.site,
	};

	componentWillMount() {
		this.changeGoogleCode = this.handleVerificationCodeChange( 'googleCode' );
		this.changeBingCode = this.handleVerificationCodeChange( 'bingCode' );
		this.changePinterestCode = this.handleVerificationCodeChange( 'pinterestCode' );
		this.changeYandexCode = this.handleVerificationCodeChange( 'yandexCode' );
	}

	componentDidMount() {
		this.refreshSite();
	}

	componentWillReceiveProps( nextProps ) {
		const { siteId: prevSiteId, translate } = this.props;
		const { site: nextSite, siteId: nextSiteId } = nextProps;
		const { dirtyFields } = this.state;

		// save success
		if ( this.state.isSubmittingForm && nextProps.isSaveSuccess ) {
			this.props.markSaved();
			this.props.requestSiteSettings( nextProps.siteId );
			this.refreshSite();
			this.setState( {
				isSubmittingForm: false,
				dirtyFields: new Set(),
			} );
		}

		// save error
		if ( this.state.isSubmittingForm && nextProps.saveError ) {
			this.setState( { isSubmittingForm: false } );
			notices.error( translate( 'There was a problem saving your changes. Please, try again.' ) );
		}

		// if we are changing sites, everything goes
		if ( prevSiteId !== nextSiteId ) {
			return this.setState(
				{
					...this.stateForSite( nextSite ),
					invalidatedSiteObject: nextSite,
					dirtyFields: new Set(),
				},
				this.refreshSite
			);
		}

		let nextState = {
			...this.stateForSite( nextProps.site ),
		};

		// Don't update state for fields the user has edited
		nextState = omit( nextState, [ ...dirtyFields ] );

		this.setState( {
			...nextState,
		} );
	}

	stateForSite( site ) {
		return {
			googleCode: get( site, 'options.verification_services_codes.google', '' ),
			bingCode: get( site, 'options.verification_services_codes.bing', '' ),
			pinterestCode: get( site, 'options.verification_services_codes.pinterest', '' ),
			yandexCode: get( site, 'options.verification_services_codes.yandex', '' ),
			isFetchingSettings: get( site, 'fetchingSettings', false ),
		};
	}

	refreshSite() {
		const { site, siteId } = this.props;

		if ( site ) {
			this.setState(
				{
					invalidatedSiteObject: site,
				},
				() => this.props.requestSite( siteId )
			);
		}
	}

	getMetaTag( serviceName = '', content = '' ) {
		if ( ! content ) {
			return '';
		}

		if ( includes( content, '<meta' ) ) {
			// We were passed a meta tag already!
			return content;
		}

		return `<meta name="${ get(
			SiteVerification.serviceIds,
			serviceName,
			''
		) }" content="${ content }" />`;
	}

	isValidCode( serviceName = '', content = '' ) {
		if ( ! content.length ) {
			return true;
		}

		content = this.getMetaTag( serviceName, content );

		return includes( content, SiteVerification.serviceIds[ serviceName ] );
	}

	hasError( service ) {
		const { invalidCodes = [] } = this.state;

		return includes( invalidCodes, service );
	}

	handleVerificationCodeChange( serviceCode ) {
		return event => {
			if ( ! this.state.hasOwnProperty( serviceCode ) ) {
				return;
			}

			// Show an error if the user types into the field
			if ( event.target.value.length === 1 ) {
				this.setState( {
					showPasteError: true,
					invalidCodes: [ serviceCode.replace( 'Code', '' ) ],
				} );
				return;
			}

			const dirtyFields = new Set( this.state.dirtyFields );
			dirtyFields.add( serviceCode );

			this.setState( {
				invalidCodes: [],
				showPasteError: false,
				[ serviceCode ]: event.target.value,
				dirtyFields,
			} );
		};
	}

	getVerificationError( isPasteError ) {
		const { translate } = this.props;

		return (
			<FormInputValidation
				isError={ true }
				text={
					isPasteError
						? translate( 'Verification code should be copied and pasted into this field.' )
						: translate( 'Invalid site verification tag.' )
				}
			/>
		);
	}

	handleFormSubmit = event => {
		const { siteId, translate, trackSiteVerificationUpdated } = this.props;
		const { dirtyFields } = this.state;

		if ( ! event.isDefaultPrevented() && event.nativeEvent ) {
			event.preventDefault();
		}

		notices.clearNotices( 'notices' );

		const verificationCodes = {
			google: this.state.googleCode,
			bing: this.state.bingCode,
			pinterest: this.state.pinterestCode,
			yandex: this.state.yandexCode,
		};

		const filteredCodes = pickBy( verificationCodes, isString );
		const invalidCodes = Object.keys(
			pickBy( filteredCodes, ( name, content ) => ! this.isValidCode( content, name ) )
		);

		this.setState( { invalidCodes } );
		if ( invalidCodes.length > 0 ) {
			notices.error( translate( 'Invalid site verification tag entered.' ) );
			return;
		}

		this.setState( {
			isSubmittingForm: true,
		} );

		const updatedOptions = {
			verification_services_codes: filteredCodes,
		};

		this.props.saveSiteSettings( siteId, updatedOptions );
		this.props.trackFormSubmitted();

		if ( dirtyFields.has( 'googleCode' ) ) {
			trackSiteVerificationUpdated( 'google' );
		}

		if ( dirtyFields.has( 'bingCode' ) ) {
			trackSiteVerificationUpdated( 'bing' );
		}

		if ( dirtyFields.has( 'pinterestCode' ) ) {
			trackSiteVerificationUpdated( 'pinterest' );
		}

		if ( dirtyFields.has( 'yandexCode' ) ) {
			trackSiteVerificationUpdated( 'yandex' );
		}
	};

	render() {
		const {
			isVerificationToolsActive,
			jetpackVersionSupportsSeo,
			siteId,
			siteIsJetpack,
			translate,
		} = this.props;
		const {
			isSubmittingForm,
			isFetchingSettings,
			showPasteError = false,
			invalidCodes = [],
		} = this.state;
		const isJetpackUnsupported = siteIsJetpack && ! jetpackVersionSupportsSeo;
		const isDisabled = isJetpackUnsupported || isSubmittingForm || isFetchingSettings;
		const isVerificationDisabled = isDisabled || isVerificationToolsActive === false;
		const isSaveDisabled =
			isDisabled || isSubmittingForm || ( ! showPasteError && invalidCodes.length > 0 );
		const placeholderTagContent = '1234';

		// The API returns 'false' for an empty array value, so we force it to an empty string if needed
		let { googleCode, bingCode, pinterestCode, yandexCode } = this.state;
		googleCode = this.getMetaTag( 'google', googleCode || '' );
		bingCode = this.getMetaTag( 'bing', bingCode || '' );
		pinterestCode = this.getMetaTag( 'pinterest', pinterestCode || '' );
		yandexCode = this.getMetaTag( 'yandex', yandexCode || '' );

		return (
			<div className="seo-settings__site-verification">
				<QuerySiteSettings siteId={ siteId } />
				{ siteIsJetpack && <QueryJetpackModules siteId={ siteId } /> }

				<SectionHeader label="Webmaster Tools" />

				<Card compact>
					<p>
						Get access to advanced search engines features by verifying your site with these popular webmaster tools:
					</p>

					{ siteIsJetpack && (
						<FormFieldset>
							<SupportInfo
								text={ translate(
									'Provides the necessary hidden tags needed to verify your WordPress site with various services.'
								) }
								link="https://jetpack.com/support/site-verification-tools/"
							/>
							<JetpackModuleToggle
								siteId={ siteId }
								moduleSlug="verification-tools"
								label={ translate( 'Enable Site Verification Services.' ) }
								disabled={ isDisabled }
							/>
						</FormFieldset>
					) }
				</Card>

				<form onChange={ this.props.markChanged } className="seo-settings__seo-form">
					<ul className="sharing-services-group__services">
						<li>
							<FoldableCard className="sharing-service" clickableHeader compact header={ (
								<div>
									<img src="/calypso/images/seo/google.png" className="sharing-service__logo"
										width={ 44 } />

									<div className="sharing-service__name">
										<h2>Google Search Console</h2>

										<p className="sharing-service__description">
											Make your site shine in Google Search results
										</p>
									</div>
								</div>
							) } summary="&nbsp;">
								<div className="sharing-service__content">
									<div className="sharing-service-example">
										<div className="sharing-service-description">
											Google Search Console helps you monitor and maintain your site's presence in
											Google Search results:

											<ul>
												<li>Make sure that Google can access your content</li>
												<li>Track your site's search performance</li>
												<li>Discover sites that are linking to your website</li>
											</ul>
										</div>

										<p>
											Enter the HTML tag code provided by <ExternalLink
											icon={ true }
											target="_blank"
											href="https://www.google.com/webmasters/tools/"
										>Google Search Console</ExternalLink> (<ExternalLink
											target="_blank"
											href="https://en.support.wordpress.com/webmaster-tools/"
										>learn more</ExternalLink>):
										</p>

										<div className="sharing-tag">
											<FormFieldset>
												<FormInput
													prefix={ translate( 'Google' ) }
													name="verification_code_google"
													type="text"
													value={ googleCode }
													id="verification_code_google"
													spellCheck="false"
													disabled={ isVerificationDisabled }
													isError={ this.hasError( 'google' ) }
													placeholder={ this.getMetaTag( 'google', placeholderTagContent ) }
													onChange={ this.changeGoogleCode }
												/>
												{ this.hasError( 'google' ) && this.getVerificationError( showPasteError ) }
											</FormFieldset>

											<Button primary>
												Save
											</Button>
										</div>
									</div>
								</div>
							</FoldableCard>
						</li>

						<li>
							<FoldableCard className="sharing-service" clickableHeader compact header={ (
								<div>
									<img src="/calypso/images/seo/bing.png" className="sharing-service__logo"
										width={ 42 } />

									<div className="sharing-service__name">
										<h2>Bing Webmaster Tools</h2>

										<p className="sharing-service__description">
											Get insights on what people are searching on Bing
										</p>
									</div>
								</div>
							) } summary="&nbsp;">
								<div className="sharing-service__content">
									<div className="sharing-service-example">
										<p>
											Enter the HTML tag code provided by <ExternalLink
											icon
											target="_blank"
											href="https://www.bing.com/toolbox/webmaster/"
										>Bing Webmaster Tools</ExternalLink> (<ExternalLink
											target="_blank"
											href="https://en.support.wordpress.com/webmaster-tools/"
										>learn more</ExternalLink>):
										</p>

										<div className="sharing-tag">
											<FormFieldset>
												<FormInput
													prefix={ translate( 'Bing' ) }
													name="verification_code_bing"
													type="text"
													value={ bingCode }
													id="verification_code_bing"
													spellCheck="false"
													disabled={ isVerificationDisabled }
													isError={ this.hasError( 'bing' ) }
													placeholder={ this.getMetaTag( 'bing', placeholderTagContent ) }
													onChange={ this.changeBingCode }
												/>
												{ this.hasError( 'bing' ) && this.getVerificationError( showPasteError ) }
											</FormFieldset>

											<Button primary>
												Save
											</Button>
										</div>
									</div>
								</div>
							</FoldableCard>
						</li>

						<li>
							<FoldableCard className="sharing-service" clickableHeader compact header={ (
								<div>
									<img src="/calypso/images/seo/pinterest.png" className="sharing-service__logo"
										width={ 40 } />

									<div className="sharing-service__name">
										<h2>Pinterest</h2>

										<p className="sharing-service__description">
											Get access to analytics and other Pinterest features
										</p>
									</div>
								</div>
							) } summary="&nbsp;">
								<div className="sharing-service__content">
									<div className="sharing-service-example">
										<p>
											Enter the HTML tag code provided by <ExternalLink
											icon={ true }
											target="_blank"
											href="https://pinterest.com/website/verify/"
										>Pinterest</ExternalLink> (<ExternalLink
											target="_blank"
											href="https://en.support.wordpress.com/webmaster-tools/"
										>learn more</ExternalLink>):
										</p>

										<div className="sharing-tag">
											<FormFieldset>
												<FormInput
													prefix={ translate( 'Pinterest' ) }
													name="verification_code_pinterest"
													type="text"
													value={ pinterestCode }
													id="verification_code_pinterest"
													spellCheck="false"
													disabled={ isVerificationDisabled }
													isError={ this.hasError( 'pinterest' ) }
													placeholder={ this.getMetaTag( 'pinterest', placeholderTagContent ) }
													onChange={ this.changePinterestCode }
												/>
												{ this.hasError( 'pinterest' ) && this.getVerificationError( showPasteError ) }
											</FormFieldset>

											<Button primary>
												Save
											</Button>
										</div>
									</div>
								</div>
							</FoldableCard>
						</li>

						<li>
							<FoldableCard className="sharing-service" clickableHeader compact header={ (
								<div>
									<img src="/calypso/images/seo/yandex.png" className="sharing-service__logo"
										width={ 42 } />

									<div className="sharing-service__name">
										<h2>Yandex.Webmaster</h2>

										<p className="sharing-service__description">
											Track statistics for queries that showed your site in Yandex search results
										</p>
									</div>
								</div>
							) } summary="&nbsp;">
								<div className="sharing-service__content">
									<div className="sharing-service-example">
										<p>
											Enter the HTML tag code provided by <ExternalLink
											icon={ true }
											target="_blank"
											href="https://webmaster.yandex.com/"
										>Yandex.Webmaster</ExternalLink> (<ExternalLink
											target="_blank"
											href="https://en.support.wordpress.com/webmaster-tools/"
										>learn more</ExternalLink>):
										</p>

										<div className="sharing-tag">
											<FormFieldset>
												<FormInput
													prefix={ translate( 'Yandex' ) }
													name="verification_code_yandex"
													type="text"
													value={ yandexCode }
													id="verification_code_yandex"
													spellCheck="false"
													disabled={ isVerificationDisabled }
													isError={ this.hasError( 'yandex' ) }
													placeholder={ this.getMetaTag( 'yandex', placeholderTagContent ) }
													onChange={ this.changeYandexCode }
												/>
												{ this.hasError( 'yandex' ) && this.getVerificationError( showPasteError ) }
											</FormFieldset>

											<Button primary>
												Save
											</Button>
										</div>
									</div>
								</div>
							</FoldableCard>
						</li>
					</ul>
				</form>
			</div>
		);
	}
}

export default connect(
	state => {
		const site = getSelectedSite( state );
		const siteId = getSelectedSiteId( state );

		return {
			isSaveSuccess: isSiteSettingsSaveSuccessful( state, siteId ),
			isVerificationToolsActive: isJetpackModuleActive( state, siteId, 'verification-tools' ),
			jetpackVersionSupportsSeo: isJetpackMinimumVersion( state, siteId, '4.4-beta1' ),
			saveError: getSiteSettingsSaveError( state, siteId ),
			site,
			siteId,
			siteIsJetpack: isJetpackSite( state, siteId ),
		};
	},
	{
		requestSite,
		requestSiteSettings,
		saveSiteSettings,
		trackSiteVerificationUpdated: service =>
			recordTracksEvent( 'calypso_seo_tools_site_verification_updated', {
				service,
			} ),
		trackFormSubmitted: partial( recordTracksEvent, 'calypso_seo_settings_form_submit' ),
	},
	undefined,
	{ pure: false } // defaults to true, but this component has internal state
)( protectForm( localize( SiteVerification ) ) );
