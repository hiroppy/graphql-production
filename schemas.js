'use strict';

const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  type B1 {
    b1a: String!
    b1b: String!
  }

  type A1 {
    a1a: String!
    a1b: B1
  }

  type Test {
    t: String!
  }

  type Org {
    name: String
    test: Test!
  }

  type Query {
    a: A1
    users: [A1]
    orgs: [Org]
  }
`;

const user = {
  a1a: 'a1a',
  a1b: {
    b1a: 'b1a',
    b1b: 'b1b'
  }
};

const orgs = [
  {
    test: {
      t: 'yes'
    }
  }
];

const resolvers = {
  Query: {
    a: () => user,
    users: () => [user],
    orgs: () => orgs
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = {
  schema
};
