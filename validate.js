'use strict';

const { equal } = require('assert');
const { parse, validate } = require('graphql');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { schema } = require('./schemas');

function run(ast, { max = 1000, scalarCost = 1, objectCost = 0 }) {
  const errors = validate(schema, ast, [
    createComplexityLimitRule(max, {
      scalarCost,
      objectCost,
      onCost: (cost) => {
        console.log('query cost:', cost);
      }
    })
  ]);

  equal(errors.length, 0);
}

// Common
// {
//   a {   # Field: name
//     a1a # Field: name
//   }
// }

// Rules: objectCost
// Field: Name = 1
// root: 1, not root: objectCost
{
  {
    const ast = parse(`
      query {
        a {
          a1a
        }
      }
    `);

    // cost: 0
    // a(not root) * cost + a.a1a(root) = 1
    // cost: 1
    // a(not root) * 1 + a.a1a(root) = 2
    // cost: 2
    // a(not root) * 2 + a.a1a(root) = 3
    const expected = [1, 2, 3];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        objectCost: i
      });
    });
  }

  {
    const ast = parse(`
      query {
        a {
          a1b {
            b1a
            b1b
          }
        }
      }
    `);

    // cost: 0
    // a(not root) * 0 + a.a1b(not root) * 0 + a.a1b.b1a + a.a1b.b1b = 2
    // cost: 1
    // a(not root) * 1 + a.a1b(not root) * 1 + a.a1b.b1a + a.a1b.b1b = 4
    // cost: 2
    // a(not root) * 2 + a.a1b(not root) * 2 + a.a1b.b1a + a.a1b.b1b = 6
    const expected = [2, 4, 6];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        objectCost: i
      });
    });
  }

  {
    const ast = parse(`
      query {
        a {
          a1a
          a1b {
            b1a
            b1b
          }
        }
      }
    `);

    // cost: 0
    // a(not root) * 0 + a.a1a + a.a1b(not root) * 0 + a.a1b.b1a + a.a1b.b1b = 3
    // cost: 1
    // a(not root) * 1 + a.a1a + a.a1b(not root) * 1 + a.a1b.b1a + a.a1b.b1b = 5
    // cost: 2
    // a(not root) * 2 + a.a1a + a.a1b(not root) * 2 + a.a1b.b1a + a.a1b.b1b = 7
    const expected = [3, 5, 7];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        objectCost: i
      });
    });
  }
}

// Rules: scalarCost
// Field: Name = 1
// root: scalarCost, not root: 1
{
  {
    const ast = parse(`
      query {
        a {
          a1a
          a1b {
            b1a
            b1b
          }
        }
      }
    `);

    // 1 is default
    // cost: 2
    // a(not root) * 0 + a.a1a + a.a1b(not root) * 0 + a.a1b.b1a + a.a1b.b1b = 3
    // cost: 3
    // a(not root) * 1 + a.a1a * 3 + a.a1b(not root) * 1 + a.a1b.b1a * 3 + a.a1b.b1b * 3 = 11
    // cost: 4
    // a(not root) * 1 + a.a1a * 4 + a.a1b(not root) * 1 + a.a1b.b1a * 4 + a.a1b.b1b * 4 = 14
    const expected = [8, 11, 14];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        objectCost: 1,
        scalarCost: i + 2
      });
    });
  }
}

// Conclusion
// Field: 1
// root: scalarCost * 1
// not root: objectCost * 1
