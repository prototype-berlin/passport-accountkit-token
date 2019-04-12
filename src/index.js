import uri from 'url';
import { OAuth2Strategy, InternalOAuthError } from 'passport-oauth';

/**
 * `AccountKitTokenStrategy` constructor.
 *
 * The Facebook authentication strategy authenticates requests by delegating to
 * Facebook using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `error` should be set.
 *
 * @param {Object} options
 * @param {Function} verify
 * @example
 * passport.use(new AccountKitTokenStrategy({
 *   clientID: '123456789',
 *   clientSecret: 'shhh-its-a-secret'
 * }), (accessToken, refreshToken, profile, done) => {
 *   User.findOrCreate({facebookId: profile.id}, done);
 * });
 */
export default class AccountKitTokenStrategy extends OAuth2Strategy {
  constructor(_options, _verify) {
    const options = _options || {};
    const verify = _verify;
    const _fbGraphVersion = options.fbGraphVersion || 'v1.3';

    options.authorizationURL = options.authorizationURL || `https://www.facebook.com/${_fbGraphVersion}/dialog/oauth`;
    options.tokenURL = options.tokenURL || `https://graph.accountkit.com/${_fbGraphVersion}/oauth/access_token`;

    super(options, verify);

    this.name = 'accountkit-token';
    this._accessTokenField = options.accessTokenField || 'access_token';
    this._refreshTokenField = options.refreshTokenField || 'refresh_token';
    this._profileURL = options.profileURL || `https://graph.accountkit.com/${_fbGraphVersion}/me`;
    this._profileFields = options.profileFields || ['id'];
    this._profileImage = options.profileImage || {};
    this._clientSecret = options.clientSecret;
    this._enableProof = typeof options.enableProof === 'boolean' ? options.enableProof : true;
    this._passReqToCallback = options.passReqToCallback;
    this._oauth2.useAuthorizationHeaderforGET(false);
    this._fbGraphVersion = _fbGraphVersion;
  }

  /**
   * Authenticate request by delegating to a service provider using OAuth 2.0.
   * @param {Object} req
   * @param {Object} options
   */
  authenticate(req, options) {
    const accessToken = this.lookup(req, this._accessTokenField);
    const refreshToken = this.lookup(req, this._refreshTokenField);

    if (!accessToken) return this.fail({
      message: `You should provide ${this._accessTokenField}`,
    });

    this._loadUserProfile(accessToken, (error, profile) => {
      if (error) return this.error(error);

      const verified = (error, user, info) => {
        if (error) return this.error(error);
        if (!user) return this.fail(info);

        return this.success(user, info);
      };

      if (this._passReqToCallback) {
        this._verify(req, accessToken, refreshToken, profile, verified);
      } else {
        this._verify(accessToken, refreshToken, profile, verified);
      }
    });
  }

  /**
   * Retrieve user profile from Account Kit.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `provider`         always set to `accountkit`
   *   - `id`               the user's ID
   *   - `phone`            the user's phone number
   *   - `email`            the user's email address
   *
   * @param {String} accessToken
   * @param {Function} done
   */
  userProfile(accessToken, done) {
    let profileURL = uri.parse(this._profileURL);

    profileURL = uri.format(profileURL);

    this._oauth2.get(profileURL, accessToken, (error, body, res) => {
      if (error) return done(new InternalOAuthError('Failed to fetch user profile', error));

      try {
        const json = JSON.parse(body);

        const profile = {
          provider: 'accountkit',
          id: json.id,
          email: json.email || '',
          phone: json.phone || '',
          _raw: body,
          _json: json,
        };

        done(null, profile);
      } catch (e) {
        done(e);
      }
    });
  }

  /**
   * Parses an OAuth2 RFC6750 bearer authorization token, this method additionally is RFC 2616 compliant and respects
   * case insensitive headers.
   *
   * @param {Object} req http request object
   * @returns {String} value for field within body, query, or headers
   */
  parseOAuth2Token(req) {
    const OAuth2AuthorizationField = 'Authorization';
    const headerValue = (req.headers && (req.headers[OAuth2AuthorizationField] || req.headers[OAuth2AuthorizationField.toLowerCase()]));

    return (
      headerValue && (() => {
        const bearerRE = /Bearer\ (.*)/;
        let match = bearerRE.exec(headerValue);

        return (match && match[1]);
      })()
    );
  }

  /**
   * Performs a lookup of the param field within the request, this method handles searhing the body, query, and header.
   * Additionally this method is RFC 2616 compliant and allows for case insensitive headers. This method additionally will
   * delegate outwards to the OAuth2Token parser to validate whether a OAuth2 bearer token has been provided.
   *
   * @param {Object} req http request object
   * @param {String} field
   * @returns {String} value for field within body, query, or headers
   */
  lookup(req, field) {
    return (
      req.body && req.body[field] ||
      req.query && req.query[field] ||
      req.headers && (req.headers[field] || req.headers[field.toLowerCase()]) ||
      this.parseOAuth2Token(req)
    );
  }

  /**
   * Converts array of profile fields to string
   * @param {Array} _profileFields Profile fields i.e. ['id', 'email']
   * @returns {String}
   */
  static convertProfileFields(_profileFields) {
    let profileFields = _profileFields || [];
    let map = {
      'id': 'id',
      'phone': 'phone',
      'email': 'email',
    };

    return profileFields.reduce((acc, field) => acc.concat(map[field] || field), []).join(',');
  }
}
