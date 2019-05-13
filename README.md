# passport-accountkit-token

Account Kit token strategy for our loopback projects.

## Installation

    $ npm install https://github.com/prototype-berlin/passport-accountkit-token.git

hub

accountkit: {
  provider: 'accountkit',
  module: 'passport-accountkit-token',
  strategy: 'AccountKitTokenStrategy',
  clientID: process.env.ACCOUNT_KIT_TOKEN,
  clientSecret: process.env.ACCOUNT_KIT_SECRET,
  callbackURL: `${process.env.URL}/auth/accountkit/callback`,
  xxoxo1838671: true,
},
```
