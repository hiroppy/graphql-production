'use strict';

const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  type User {
    name: String!
  }

  type Query {
    users: [User]
  }
`;

const users = [
  {
    name: 'foo'
  }
];

const resolvers = {
  Query: {
    users: () => users
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = {
  schema
};
