'use strict';
import ExtendableError from 'es6-error';

export class RouterControllerError extends ExtendableError {
  constructor(code, message) {
    super(typeof message !== 'undefined' ? message : code);
    this.code = code;
  }
}

export class RouterApiError extends RouterControllerError {}

export class XhrError extends ExtendableError {
  constructor(code, message) {
    super(typeof message !== 'undefined' ? message : code);
    this.code = code;
  }
}

export let apiErrorCodes = {
  100002: 'ERROR_SYSTEM_NO_SUPPORT',
  100003: 'ERROR_SYSTEM_NO_RIGHTS',
  100004: 'ERROR_SYSTEM_BUSY',
  108001: 'ERROR_LOGIN_USERNAME_WRONG',
  108002: 'ERROR_LOGIN_PASSWORD_WRONG',
  108003: 'ERROR_LOGIN_ALREADY_LOGIN',
  108006: 'ERROR_LOGIN_USERNAME_PWD_WRONG',
  108007: 'ERROR_LOGIN_USERNAME_PWD_ORERRUN',
  120001: 'ERROR_VOICE_BUSY',
  125001: 'ERROR_WRONG_TOKEN',
  125002: 'ERROR_WRONG_SESSION',
  125003: 'ERROR_WRONG_SESSION_TOKEN',
  111019: 'ERROR_USSD_PROCESSING',
  111020: 'ERROR_USSD_TIMEOUT',
  113018: 'SMS_SYSTEM_BUSY',
  113053: 'SMS_NOT_ENOUGH_SPACE',
};

/* const errors = [
  'xhr_error',
  'xhr_invalid_xml',
  'xhr_invalid_status',
  'xml_type_invalid',
  'xml_response_not_ok',
  'tabs_not_found',
  'chrome_runtime_message_error',
  'chrome_tabs_message_error',
  'router_url_not_set',
  'chrome_storage_error',
  'invalid_router_url',
  'xhr_timeout',
  'ussd_timeout',
  'ussd_release_fail',
];*/

export function getRouterApiErrorName(code) {
  return apiErrorCodes[code];
}
