'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { schema } = require('./schemas');

const ComplexityLimitRule = createComplexityLimitRule(/* total のコストサイズ */ 1000, {
  objectCost: 0,
  onCost: (cost) => {
    console.log('query cost:', cost);
  },
  formatErrorMessage: (cost) => `query with cost ${cost} exceeds complexity limit`
});

const app = express();

app.use(
  '/',
  graphqlHTTP({
    schema,
    graphiql: true,
    validationRules: [ComplexityLimitRule]
  })
);

app.listen(8080);

// 1 0
// {
//   a {
//     a1a
//   }
// }

// a * cost + a.ala * cost = 0 + 1 = 1

// * 2

// {
//   user {
//     name {
//       a
//       b
//     }
//   }
// }

// * 2
// kind: Name
// 根本なら1, 続きがあるなら3
// user * 2 + user.name * 2 + user.name.a + user.name.b
// 2 + 2 + 1 + 1 = 6

// * 3
// 3 + 3 + 1 + 1 = 8

// * 3
// user * 3 + user.hi + user.name * 3 + user.name.a + user.name.b
// 3 + 1 + 3 + 1 + 1 = 9
