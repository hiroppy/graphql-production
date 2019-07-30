'use strict';

const express = require('express');
const { parse, validate } = require('graphql');
const graphqlHTTP = require('express-graphql');
const { schema } = require('./schemas');

const ast = parse(`
  query {
    users {
      name
    }
  }
`);

const errors = validate(schema, ast);
// const errors = validate(schema, ast, [createComplexityLimitRule(9)]);

const app = express();

app.use(
  '/',
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(8080);
