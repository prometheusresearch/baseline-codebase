module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "parser": "babel-eslint",
    "extends": "eslint:recommended",
//  "parserOptions": {
//      "ecmaFeatures": {
//          "experimentalObjectRestSpread": true,
//          "jsx": true
//      },
//      "sourceType": "module"
//  },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/jsx-uses-vars": 2,
        "react/jsx-no-undef": 2,
        "react/jsx-uses-react": 2,
        "react/react-in-jsx-scope": 2,
        "react/self-closing-comp": 2,
        "jsx-quotes": [2, "prefer-double"],
        "comma-dangle": [
          1,
          "only-multiline"
        ],
        "indent": [
            2,
            2
        ],
        "linebreak-style": [
            2,
            "unix"
        ],
        "quotes": [
            2,
            "single"
        ],
        "semi": [
            2,
            "always"
        ]
    }
};
