'use strict';

const { equal } = require('assert');
const { parse, validate } = require('graphql');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { schema } = require('./schemas');

function run(ast, { max = 1000, scalarCost = 1, objectCost = 0, listFactor = 10 }) {
  const errors = validate(schema, ast, [
    createComplexityLimitRule(max, {
      scalarCost,
      objectCost,
      listFactor,
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

// listFactor
{
  {
    const ast = parse(`
      query {
        arr {
          arr1 {
            name
          }
        }
      }
    `);

    // cost: 10
    // arr.arr1.name * 10 = 10
    // cost: 20
    // arr.arr1.name * 20 = 10
    // cost: 30
    // arr.arr1.name * 30 = 30
    const expected = [10, 20, 30];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        listFactor: 10 * (i + 1)
      });
    });
  }

  {
    const ast = parse(`
      query {
        arr {
          arr2 {
            name
            id
          }
        }
      }
    `);

    // cost: 10
    // arr.arr2.name * 10 + arr.arr2.id * 10 = 20
    // cost: 20
    // arr.arr2.name * 20 + arr.arr2.id * 20 = 40
    // cost: 30
    // arr.arr2.name * 30 + arr.arr2.id * 30 = 60
    const expected = [20, 40, 60];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        listFactor: 10 * (i + 1)
      });
    });
  }

  {
    const ast = parse(`
      query {
        arr {
          arr1 {
            name
          }
          arr2 {
            name
            id
          }
        }
      }
    `);

    // cost: 10
    // arr.arr1.name * 10 + arr.arr2.name * 10 + arr.arr2.id * 10 = 30
    // cost: 20
    // arr.arr1.name * 20 + arr.arr2.name * 20 + arr.arr2.id * 20 = 60
    // cost: 30
    // arr.arr1.name * 30 + arr.arr2.name * 30 + arr.arr2.id * 30 = 90
    const expected = [30, 60, 90];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        listFactor: 10 * (i + 1)
      });
    });
  }

  {
    const ast = parse(`
      query {
        arr {
          arr1 {
            name
          }
        }
      }
    `);

    // objectCost: 0, listFactor: 10
    // arr(not root) * 0 + arr.arr1(not root) * 0 * 10 + arr.arr1.name * 10 = 10
    // objectCost: 1, listFactor: 20
    // arr(not root) * 1 + arr.arr1(not root) * 1 * 20 + arr.arr1.name * 20 = 41
    // objectCost: 2, listFactor: 30
    // arr(not root) * 2 + arr.arr1(not root) * 2 * 30 + arr.arr1.name * 30 = 92
    const expected = [10, 41, 92];

    expected.forEach((v, i) => {
      run(ast, {
        max: v,
        objectCost: i,
        listFactor: 10 * (i + 1)
      });
    });
  }
}

// combine
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
        arr {
          arr1 {
            name
          }
          arr2 {
            name
            id
          }
        }
      }
    `);

  // objectCost: 0, listFactor: 10
  // (a(not root) * 0 + a.a1a + a.a1b(not root) * 0 + a.a1b.b1a + a.a1b.b1b)
  // + (arr(not root) * 0 + arr.arr1(not root but has an array) * 0 * 10 + arr.arr1.name * 10
  // + arr.arr2(not root but has an array) * 0 * 10 + arr.arr2.name * 10 + arr.arr2.id * 10)
  // = 3 + 10 + 20 = 33

  // objectCost: 1, listFactor: 20
  // (a(not root) * 1 + a.a1a + a.a1b(not root) * 1 + a.a1b.b1a + a.a1b.b1b) +
  // + (arr(not root) * 1 + arr.arr1(not root but has an array) * 1 * 20 + arr.arr1.name * 20
  // + arr.arr2(not root but has an array) * 1 * 20 + arr.arr2.name * 20 + arr.arr2.id * 20)
  // = 5 + 41 + 60 = 106

  // objectCost: 2, listFactor: 30
  // (a(not root) * 2 + a.a1a + a.a1b(not root) * 2 + a.a1b.b1a + a.a1b.b1b)
  // + (arr(not root) * 2 + arr.arr1(not root but has an array) * 2 * 30 + arr.arr1.name * 30
  // + arr.arr2(not root but has an array) * 2 * 30 + arr.arr2.name * 30 + arr.arr2.id * 30)
  // = 7 + 92 + 120 = 219

  const expected = [33, 106, 219];

  expected.forEach((v, i) => {
    run(ast, {
      max: v,
      objectCost: i,
      listFactor: 10 * (i + 1)
    });
  });
}

// Conclusion
// Field: 1
// root: scalarCost * 1
// not root: objectCost * 1
// list: listFactor * 10

// e.g.

// query {
//   a {       # * objectCost
//     a1a     # * scalarCost
//     a1b {   # * objectCost
//       b1a   # * scalerCost
//       b1b   # * scalerCost
//     }
//   }
//   arr {     # * objectCost
//     arr1 {  # * objectCost * listFactor
//       name  # listFactor
//     }
//     arr2 {  # objectCost * listFactor
//       name  # listFactor
//       id    # listFactor
//     }
//   }
// }

// a * objectCost + a.a1a * scalarCost + a.a1b * objectCost + a.a1b.b1a * scalerCost + a.a1b.b1b * scalerCost
// + arr * objectCost + arr.arr1 * objectCost * listFactor + arr.arr1.name * listFactor
// + arr.arr2 * objectCost * listFactor + arr.arr2.name * listFactor + arr.arr2.id * listFactor
