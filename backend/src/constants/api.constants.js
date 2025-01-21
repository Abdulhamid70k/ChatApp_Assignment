//src/constants/apiConstants.js
export const Response_status = {
    "STATUS_SUCCESS_OK": 200,
    "STATUS_SUCCESS_CREATED": 201,
    "PERMANENT_REDIRECT": 301,
    "TEMPORARY_REDIRECT": 302,
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "METHOD_NOT_ALLOWED": 405,
    "CONFLICT": 409,
    "UNPROCESSABLE_ENTITY": 422,
    "INTERNAL_SERVER_ERROR": 500,
    "SERVICE_UNAVAILABLE": 503
}

export const Response_data = {
    "SUCCESS": "Success",
    "ERROR": "Error",
    "BAD_REQUEST": "Bad Request",
    "UNAUTHORIZED": "Unauthorized",
    "FORBIDDEN": "Forbidden",
    "NOT_FOUND": "Resource Not Found",
    "METHOD_NOT_ALLOWED": "Method Not Allowed",
    "CONFLICT": "Resource Conflict",
    "VALIDATION_ERROR": "Validation Failed",
    "SERVER_ERROR": "Internal Server Error",
    "SERVICE_UNAVAILABLE": "Service Temporarily Unavailable"
}