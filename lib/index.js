'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _passportOauth = require('passport-oauth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
var AccountKitTokenStrategy = function (_OAuth2Strategy) {
  _inherits(AccountKitTokenStrategy, _OAuth2Strategy);

  function AccountKitTokenStrategy(_options, _verify) {
    _classCallCheck(this, AccountKitTokenStrategy);

    var options = _options || {};
    var verify = _verify;
    var _fbGraphVersion = options.fbGraphVersion || 'v1.3';

    options.authorizationURL = options.authorizationURL || 'https://www.facebook.com/' + _fbGraphVersion + '/dialog/oauth';
    options.tokenURL = options.tokenURL || 'https://graph.accountkit.com/' + _fbGraphVersion + '/oauth/access_token';

    var _this = _possibleConstructorReturn(this, (AccountKitTokenStrategy.__proto__ || Object.getPrototypeOf(AccountKitTokenStrategy)).call(this, options, verify));

    _this.name = 'accountkit-token';
    _this._accessTokenField = options.accessTokenField || 'access_token';
    _this._refreshTokenField = options.refreshTokenField || 'refresh_token';
    _this._profileURL = options.profileURL || 'https://graph.accountkit.com/' + _fbGraphVersion + '/me';
    _this._profileFields = options.profileFields || ['id'];
    _this._profileImage = options.profileImage || {};
    _this._clientSecret = options.clientSecret;
    _this._enableProof = typeof options.enableProof === 'boolean' ? options.enableProof : true;
    _this._passReqToCallback = options.passReqToCallback;
    _this._oauth2.useAuthorizationHeaderforGET(false);
    _this._fbGraphVersion = _fbGraphVersion;
    return _this;
  }

  /**
   * Authenticate request by delegating to a service provider using OAuth 2.0.
   * @param {Object} req
   * @param {Object} options
   */


  _createClass(AccountKitTokenStrategy, [{
    key: 'authenticate',
    value: function authenticate(req, options) {
      var _this2 = this;

      var accessToken = this.lookup(req, this._accessTokenField);
      var refreshToken = this.lookup(req, this._refreshTokenField);

      if (!accessToken) return this.fail({
        message: 'You should provide ' + this._accessTokenField
      });

      this._loadUserProfile(accessToken, function (error, profile) {
        if (error) return _this2.error(error);

        var verified = function verified(error, user, info) {
          if (error) return _this2.error(error);
          if (!user) return _this2.fail(info);

          return _this2.success(user, info);
        };

        if (_this2._passReqToCallback) {
          _this2._verify(req, accessToken, refreshToken, profile, verified);
        } else {
          _this2._verify(accessToken, refreshToken, profile, verified);
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

  }, {
    key: 'userProfile',
    value: function userProfile(accessToken, done) {
      var profileURL = _url2.default.parse(this._profileURL);

      profileURL = _url2.default.format(profileURL);

      this._oauth2.get(profileURL, accessToken, function (error, body, res) {
        if (error) return done(new _passportOauth.InternalOAuthError('Failed to fetch user profile', error));

        try {
          var json = JSON.parse(body);

          var profile = {
            provider: 'accountkit',
            id: json.id,
            email: json.email || '',
            phone: json.phone || '',
            _raw: body,
            _json: json
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

  }, {
    key: 'parseOAuth2Token',
    value: function parseOAuth2Token(req) {
      var OAuth2AuthorizationField = 'Authorization';
      var headerValue = req.headers && (req.headers[OAuth2AuthorizationField] || req.headers[OAuth2AuthorizationField.toLowerCase()]);

      return headerValue && function () {
        var bearerRE = /Bearer\ (.*)/;
        var match = bearerRE.exec(headerValue);

        return match && match[1];
      }();
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

  }, {
    key: 'lookup',
    value: function lookup(req, field) {
      return req.body && req.body[field] || req.query && req.query[field] || req.headers && (req.headers[field] || req.headers[field.toLowerCase()]) || this.parseOAuth2Token(req);
    }

    /**
     * Converts array of profile fields to string
     * @param {Array} _profileFields Profile fields i.e. ['id', 'email']
     * @returns {String}
     */

  }], [{
    key: 'convertProfileFields',
    value: function convertProfileFields(_profileFields) {
      var profileFields = _profileFields || [];
      var map = {
        'id': 'id',
        'phone': 'phone',
        'email': 'email'
      };

      return profileFields.reduce(function (acc, field) {
        return acc.concat(map[field] || field);
      }, []).join(',');
    }
  }]);

  return AccountKitTokenStrategy;
}(_passportOauth.OAuth2Strategy);

exports.default = AccountKitTokenStrategy;
module.exports = exports['default'];