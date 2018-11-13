/** @format */

/**
 * External dependencies
 */
import classnames from 'classnames';
import { Button, PanelBody, Placeholder, TextControl } from '@wordpress/components';
import { InnerBlocks, InspectorControls } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';
import emailValidator from 'email-validator';
import { compose, withInstanceId } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { __ } from 'gutenberg/extensions/presets/jetpack/utils/i18n';
import HelpMessage from 'gutenberg/extensions/presets/jetpack/editor-shared/help-message';

class JetpackContactForm extends Component {
	constructor( ...args ) {
		super( ...args );
		this.onChangeSubject = this.onChangeSubject.bind( this );
		this.onChangeTo = this.onChangeTo.bind( this );
		this.onChangeSubmit = this.onChangeSubmit.bind( this );
		this.onFormSettingsSet = this.onFormSettingsSet.bind( this );
		this.getToValidationError = this.getToValidationError.bind( this );
		this.renderToAndSubjectFields = this.renderToAndSubjectFields.bind( this );
		this.preventEnterSubmittion = this.preventEnterSubmittion.bind( this );

		const to = args[ 0 ].attributes.to ? args[ 0 ].attributes.to : '';
		const error = to
			.split( ',' )
			.map( this.getToValidationError )
			.filter( Boolean );

		this.state = {
			toError: error && error.length ? error : null,
		};
	}

	getIntroMessage() {
		return __(
			'If left blank, feedback will be sent to the author of the post and the subject will be the name of this post.'
		);
	}

	getEmailHelpMessage() {
		return __(
			'You can enter multiple email addresses separated by commas. A notification email will be sent to each address.'
		);
	}

	onChangeSubject( subject ) {
		this.props.setAttributes( { subject } );
	}

	getToValidationError( email ) {
		email = email.trim();
		if ( email.length === 0 ) {
			return false; // ignore the empty emails
		}
		if ( ! emailValidator.validate( email ) ) {
			return { email };
		}
		return false;
	}

	onChangeTo( to ) {
		const emails = to.trim();
		if ( emails.length === 0 ) {
			this.setState( { toError: null } );
			this.props.setAttributes( { to } );
			return;
		}

		const error = to
			.split( ',' )
			.map( this.getToValidationError )
			.filter( Boolean );
		if ( error && error.length ) {
			this.setState( { toError: error } );
			this.props.setAttributes( { to } );
			return;
		}
		this.setState( { toError: null } );
		this.props.setAttributes( { to } );
	}

	onChangeSubmit( submit_button_text ) {
		this.props.setAttributes( { submit_button_text } );
	}

	onFormSettingsSet( event ) {
		event.preventDefault();
		if ( this.state.toError ) {
			// don't submit the form if there are errors.
			return;
		}
		this.props.setAttributes( { has_form_settings_set: 'yes' } );
	}

	getfieldEmailError( errors ) {
		if ( errors ) {
			if ( errors.length === 1 ) {
				if ( errors[ 0 ] && errors[ 0 ].email ) {
					return sprintf( __( '%s is not a valid email address.' ), errors[ 0 ].email );
				}
				return errors[ 0 ];
			}

			if ( errors.length === 2 ) {
				return sprintf(
					__( '%s and %s are not a valid email address.' ),
					errors[ 0 ].email,
					errors[ 1 ].email
				);
			}
			const inValidEmails = errors.map( error => error.email );
			return sprintf( __( '%s are not a valid email address.' ), inValidEmails.join( ', ' ) );
		}
		return null;
	}

	preventEnterSubmittion( event ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	renderToAndSubjectFields() {
		const fieldEmailError = this.state.toError;
		const { instanceId, attributes } = this.props;
		const { subject, to } = attributes;
		const hasEmailError = fieldEmailError && fieldEmailError.length > 0;
		return (
			<Fragment>
				<TextControl
					aria-describedby={ `contact-form-${ instanceId }-email-${
						hasEmailError ? 'error' : 'help'
					}` }
					label={ __( 'Email address' ) }
					placeholder={ __( 'Example: muriel@design.blog' ) }
					onKeyDown={ this.preventEnterSubmittion }
					value={ to }
					onChange={ this.onChangeTo }
				/>
				<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
					{ this.getfieldEmailError( fieldEmailError ) }
				</HelpMessage>
				<HelpMessage id={ `contact-form-${ instanceId }-email-help` }>
					{ this.getEmailHelpMessage() }
				</HelpMessage>

				<TextControl
					label={ __( 'Email subject line' ) }
					value={ subject }
					placeholder={ __( "Example: Let's work together" ) }
					onChange={ this.onChangeSubject }
				/>
			</Fragment>
		);
	}

	render() {
		const { className, attributes } = this.props;
		const { has_form_settings_set, submit_button_text } = attributes;
		const formClassnames = classnames( className, 'jetpack-contact-form', {
			'has-intro': ! has_form_settings_set,
		} );

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Email feedback settings' ) }>
						<p>{ this.getIntroMessage() }</p>
						{ this.renderToAndSubjectFields() }
					</PanelBody>
				</InspectorControls>
				<InspectorControls>
					<PanelBody title={ __( 'Button settings' ) }>
						<TextControl
							label={ __( 'Submit button label' ) }
							value={ submit_button_text }
							placeholder={ __( 'Submit' ) }
							onChange={ this.onChangeSubmit }
						/>
					</PanelBody>
				</InspectorControls>
				<div className={ formClassnames }>
					{ ! has_form_settings_set && (
						<Placeholder label={ __( 'Contact Form' ) } icon="feedback">
							<form onSubmit={ this.onFormSettingsSet }>
								<p className="jetpack-contact-form__intro-message">{ this.getIntroMessage() }</p>
								{ this.renderToAndSubjectFields() }
								<div className="jetpack-contact-form__create">
									<Button isPrimary type="submit">
										{ __( 'Create' ) }
									</Button>
								</div>
							</form>
						</Placeholder>
					) }
					{ has_form_settings_set && (
						<InnerBlocks
							templateLock={ false }
							template={ [
								[
									'jetpack/field-name',
									{
										label: __( 'Name' ),
										required: true,
									},
								],
								[
									'jetpack/field-email',
									{
										label: __( 'Email' ),
										required: true,
									},
								],
								[
									'jetpack/field-url',
									{
										label: __( 'Website' ),
									},
								],
								[
									'jetpack/field-textarea',
									{
										label: __( 'Message' ),
									},
								],
							] }
						/>
					) }
					{ has_form_settings_set && (
						<div className="button button-primary button-default jetpack-submit-button">
							{ submit_button_text ? submit_button_text : __( 'Submit' ) }
						</div>
					) }
				</div>
			</Fragment>
		);
	}
}

export default compose( [ withInstanceId ] )( JetpackContactForm );
