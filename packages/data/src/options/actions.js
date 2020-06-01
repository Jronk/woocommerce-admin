/**
 * External Dependencies
 */

import { apiFetch } from '@wordpress/data-controls';

/**
 * Internal Dependencies
 */
import TYPES from './action-types';
import { WC_ADMIN_NAMESPACE } from '../constants';

export function receiveOptions( options ) {
	return {
		type: TYPES.RECEIVE_OPTIONS,
		options,
	};
}

export function setIsRequesting( optionName ) {
	return {
		type: TYPES.SET_IS_REQUESTING,
		optionName
	};
}

export function setRequestingError( error, options ) {
	return {
		type: TYPES.SET_REQUESTING_ERROR,
		error,
		options
	};
}

export function setUpdatingError( error ) {
	return {
		type: TYPES.SET_UPDATING_ERROR,
		error,
	};
}

export function setIsUpdating( isUpdating ) {
	return {
		type: TYPES.SET_IS_UPDATING,
		isUpdating,
	};
}

export function* updateOptions( data ) {
	yield setIsUpdating( true );
	yield receiveOptions( data );

	try {
		const results = yield apiFetch( {
			path: WC_ADMIN_NAMESPACE + '/options',
			method: 'POST',
			data,
		} );

		yield setIsUpdating( false );
		return { status: 'success', ...results };
	} catch ( error ) {
		yield setUpdatingError( error );
		return { status: 'failed', ...error };
	}
}
