/*jshint maxcomplexity:15 */

/*!
 * Docker Image Factory - Authenticates request using request signature.
 * Signature is calculated using SHA HMAC (using hexdigest) of the payload
 * using pre-configured secret
 *
 */

'use strict';

var crypto = require('crypto'),
    restify = require('restify');

module.exports = usingSignedRequest;

/**
 * Returns middleware that authorizes the request payload using signature
 * specified in the header.
 *
 * @param secret Secret to be used for computing SHA HMAC of the payload.
 * @param header Header name of the request which contains signature.
 * @returns {authorize}
 */
function usingSignedRequest(secret, header) {
  header = header || 'X-Hook-Signature';

  return function authorize(req, res, next) {
      var hmac = crypto.createHmac('sha1', secret);
      hmac.update(JSON.stringify(req.body));
      var calculatedSignature = 'sha1=' + hmac.digest('hex');
      var actualSignature = req.header(header);
      if (actualSignature !== calculatedSignature) {
        return (next(
            new restify.errors.InvalidCredentialsError(
                'Mismatch in computed signature and the passed signature of the request payload.')));
      } else {
        return (next());
      }
  };

}
