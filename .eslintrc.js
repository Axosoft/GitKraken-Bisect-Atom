module.exports = {
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "globals": {
    "atom": true
  },
  "plugins": [
    "react"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "indent": [2, 2, { "SwitchCase": 1 }],
    "linebreak-style": [2, "unix"],
    "quotes": [2, "single"],
    "react/prop-types": 0, // This atom package always run in production mode anyways
    "semi": [2, "always"]
  }
};
