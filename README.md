# passport-accountkit-token

# Attention: passport-accountkit-token has been deprecated as Facebook will shut down AccountKit shortly.

Account Kit token strategy for our loopback projects.

## Installation

    $ npm install https://github.com/prototype-berlin/passport-accountkit-token.git

## Usage

### Configure Strategy

```js
accountkit: {
  provider: 'accountkit',
  module: 'passport-accountkit-token',
  strategy: 'AccountKitTokenStrategy',
  clientID: process.env.ACCOUNT_KIT_TOKEN,
  clientSecret: process.env.ACCOUNT_KIT_SECRET,
  callbackURL: `${process.env.URL}/auth/accountkit/callback`,
  session: false,
  json: true,
},
```
