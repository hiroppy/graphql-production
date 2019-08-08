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

  type Arr1 {
    name: String!
  }

  type Arr2 {
    name: String!
    id: Int!
  }

  type Arr {
    arr1: [Arr1]
    arr2: [Arr2]
  }

  type Query {
    a: A1
    arr: Arr
  }
`;

const obj = {
  a1a: 'a1a',
  a1b: {
    b1a: 'b1a',
    b1b: 'b1b'
  }
};

const arr = {
  arr1: [...new Array(10)].map((_, i) => {
    return {
      name: `name_${i}`
    };
  }),
  arr2: [...new Array(10)].map((_, i) => {
    return {
      name: `name_${i}`,
      id: `id_${i}`
    };
  })
};

const resolvers = {
  Query: {
    a: () => obj,
    arr: () => arr
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = {
  schema
};
