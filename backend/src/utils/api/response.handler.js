//src/utils/api/response.handler.js
import { Response_status, Response_data } from '../../constants/api.constants.js';

/**
 * Base response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} status - Response status (Success/Error)
 * @param {string} [message] - Optional message
 * @param {*} [data] - Response data
 */
function formatResponse(res, statusCode, status, message = '', data = null) {
    if (!res) {
        throw new Error("Response object is required");
    }

    const response = {
        status,
        success: statusCode >= 200 && statusCode < 300,
        message: message || null,
        data: data || null
    };

    return res.status(statusCode).json(response);
}

/**
 * Success Responses (2xx)
 */
export function setSuccess(res, message, data = null) {
    return formatResponse(res, Response_status.STATUS_SUCCESS_OK, Response_data.SUCCESS, message, data);
}

export function setCreated(res, message, data = null) {
    return formatResponse(res, Response_status.STATUS_SUCCESS_CREATED, Response_data.SUCCESS, message, data);
}

export function setNoContent(res) {
    return res.status(204).send();
}

/**
 * Redirection Responses (3xx)
 */
export function setPermanentRedirect(res, redirectUrl) {
    return res.redirect(Response_status.PERMANENT_REDIRECT, redirectUrl);
}

export function setTemporaryRedirect(res, redirectUrl) {
    return res.redirect(Response_status.TEMPORARY_REDIRECT, redirectUrl);
}

/**
 * Client Error Responses (4xx)
 */
export function setBadRequest(res, message, data = null) {
    return formatResponse(res, 400, Response_data.BAD_REQUEST, message, data);
}

export function setUnauthorized(res, message = 'Unauthorized') {
    return formatResponse(res, 401, Response_data.UNAUTHORIZED, message);
}

export function setForbidden(res, message = 'Forbidden') {
    return formatResponse(res, 403, Response_data.FORBIDDEN, message);
}

export function setNotFound(res, message, data = null) {
    return formatResponse(res, Response_status.NOT_FOUND, Response_data.NOT_FOUND, message, data);
}

export function setMethodNotAllowed(res, message = 'Method Not Allowed') {
    return formatResponse(res, 405, Response_data.METHOD_NOT_ALLOWED, message);
}

export function setConflict(res, message, data = null) {
    return formatResponse(res, 409, Response_data.CONFLICT, message, data);
}

export function setValidationError(res, message, errors = null) {
    return formatResponse(res, 422, Response_data.VALIDATION_ERROR, message, errors);
}

/**
 * Server Error Responses (5xx)
 */
export function setServerError(res, message, data = null) {
    const errorData = process.env.NODE_ENV === 'production' ? null : data;
    return formatResponse(res, Response_status.INTERNAL_SERVER_ERROR, Response_data.SERVER_ERROR, message, errorData);
}

export function setServiceUnavailable(res, message = 'Service Temporarily Unavailable') {
    return formatResponse(res, 503, Response_data.SERVICE_UNAVAILABLE, message);
}

/**
 * Custom Response Handlers
 */
export function setCustomResponse(res, statusCode, message, data = null) {
    const status = statusCode >= 200 && statusCode < 300
        ? Response_data.SUCCESS
        : Response_data.ERROR;
    return formatResponse(res, statusCode, status, message, data);
}
