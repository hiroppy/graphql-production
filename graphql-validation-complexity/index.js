'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { schema } = require('../schemas');

const ComplexityLimitRule = createComplexityLimitRule(/* total size */ 1000, {
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
