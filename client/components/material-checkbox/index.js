/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import { MDCFormField, MDCFoundation as FormFieldFoundation } from '@material/form-field';
import { MDCCheckbox, MDCFoundation as CheckboxFoundation } from '@material/checkbox';
import { uniqueId } from 'lodash';

export default class MaterialCheckbox extends Component {
	formFieldRef = React.createRef();
	checkboxRef = React.createRef();

	id = uniqueId();

	componentDidUpdate() {
		this.checkbox = new MDCCheckbox( this.checkboxRef.current );
		this.form = new MDCFormField( this.formFieldRef.current );
		this.form.input = this.checkbox;
	}

	render() {
		return (
			<div className="mdc-form-field" ref={ this.formFieldRef }>
				<div className="mdc-checkbox" ref={ this.checkboxRef }>
					<input type="checkbox" className="mdc-checkbox__native-control" id={ this.id } />
					<div className="mdc-checkbox__background">
						<svg className="mdc-checkbox__checkmark" viewBox="0 0 24 24">
							<path
								className="mdc-checkbox__checkmark-path"
								fill="none"
								d="M1.73,12.91 8.1,19.28 22.79,4.59"
							/>
						</svg>
						<div className="mdc-checkbox__mixedmark" />
					</div>
				</div>
				<label htmlFor={ this.id }>{ this.props.label }</label>
			</div>
		);
	}
}
