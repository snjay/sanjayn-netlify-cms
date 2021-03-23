---
layout: post
title: Make 10
author: Sanjay
date: '2016-01-14'
tags: ['javascript', 'demo']
cover: "/numbers.png"
---

Have you ever sat down on a train to have your friend poke you, point to the train's carriage number and ask, "Can you make 10?"

This project tells you how to make 10, given the 4 numbers in your train's carriage.

![Train numbers](/numbers.png)

It's extensible enough find a solution to any sequence of 4 numbers and a goal number.

### Demo

See: [https://make10.sanjayn.com/](https://make10.sanjayn.com/)

## Motivation

I wanted to create a web app so anyone could check answers on the train from their phone.

I made it harder for myself by not using external math libraries such as [itertools](https://docs.python.org/3/library/itertools.html). This was so that I would get a deeper understanding of the algorithms that I usually rely on.

This was also a pure client-side web application as I did not want to spin up a server.

## How it works

It boils down to three steps:

1. Generate all possible post-fix expressions with the 4 given numbers and the operations (+, –, x, ÷).
2. Evaluate each post-fix operation using a [stack](https://en.wikipedia.org/wiki/Stack_(abstract_data_type)).
3. Check if the result equals the goal number (e.g. "does it equal 10?")

### (1) Generate all post-fix expressions

To generate all possible post-fix expressions, we need to use some sort of [combinatorics](https://en.wikipedia.org/wiki/Combinatorics). The idea is to generate all possible expressions after all.

#### Number permutations

> *Permutations*: (loosely speaking) is an arrangement of its members into a sequence or linear order, or if the set is already ordered, a rearrangement of its elements.

We generate all possible permutations of the train carriage numbers using the following code.

```javascript
// permutations(items): generates all possible permutations without
// repetition of the items list in lexicographical order.
// ------------------
// Adapted from: Steinhaus-Johnson-Trotter algorithm
// https://en.wikipedia.org/wiki/Steinhaus%E2%80%93Johnson%E2%80%93Trotter_algorithm
const permutations = (items) => {
  // Base case: If there is a single item,
  // return the item inside of a list so it
  // can be later concatenated in General case.
  if (items.length === 1) return [items];
  // General case: Recursively call permutations
  // for items list without the last item.
  let tail = permutations(items.slice(1));
  let perms = [];
  tail.forEach(sub => {
    // Then, insert first number into every
    // possible position of 'sub'-permutation.
    sub.forEach((_, j) => {
      const pre = sub.slice(0, j);
      const mid = items[0];
      const post = sub.slice(j);
      // Push each permutation = arranging [pre, mid, post]
      perms.push(pre.concat([mid], post));
    })
  });
  return perms;
};
```

Suppose the numbers in the train carriage are 1, 2, 3, 4 and the operations are +, –, x, ÷.

For example `permutations([1,2,3])` should return 6 (= 3!) expressions of the input list. Each item in the list is a permutation of the original.

```javascript
[[1, 2, 3],  // permutation 1
 [2, 1, 3],  // permutation 2
 [2, 3, 1],  // permutation 3
 [1, 3, 2],  // permutation 4
 [3, 1, 2],  // permutation 5
 [3, 2, 1]]  // permutation 6
```

#### Operator combinations

Next, find all the different ways the operations go between the numbers.

For 4 numbers, only be 3 operations can go between the numbers.

```text
1 + 2 x 3 + 4
```

```javascript
// product(items, r): Generates r-length combinations of items with
// repetition (akin to generating r-length cartesian products of the
// items array).
const product = (items, r) => {
  // Duplicate items array r times (to use as a placeholder)
  let placeholder = Array(r).fill(items);
  // Run through the placeholder r times and build up the
  // combinations by 1 item at at time.
  return placeholder.reduce((acc, curr) => {
    // For every accumulated item,
    return acc.flatMap(a => {
      // Tack on each of the items to the end of each accumulated
      // item
      return curr.map(c => a.concat(c))
    });
  });
};
```

The combinations are produced by generting r-length combinations of the numbers list with repetition.

As an example, `product(['a', 'b', 'c'], 2)` would generate 2-length combinations with repetitions would result in:

```javascript
['aa', 'ab', 'ac',
 'ba', 'bb', 'bc',
 'ca', 'cb', 'cc']
```

The reason it is viable to generate all possible number & operation combination in the first place is because the sample space of all possibilities is quite small. For example, with 4 numbers permutations (i.e. 4! = 24) and 4 standard operations with 3 operations chosen with  [repetition](https://en.wikipedia.org/wiki/Combination#Number_of_combinations_with_repetition) (i.e. n=4, k=3 means 6C3 = 20) there are only 24 × 20 = 480  total evaluations that need to be performed.

Every number permutation and operator combination are weaved together to create a post-fix expression.

For example, if `numbers` is `[1, 2, 3, 4]` and operators is `[+, -, ×]`, then the resulting post-fix expression from the output of this function would be

```1 2 + 3 - 4 ×```

```javascript
const makePostFixExpr = (numList, opList) => {
  let expr = [numList[0]];
  let rest = numList.slice(1);
  rest.forEach((r, i) => {
    expr = expr.concat([r, opList[i]]);
  });
  return expr;
};
```

We now have a way to generate postfix expressions given a list of numbers and a list of operators.

Next, we work on writing the code that will read every generated post-fix expression in order to check whether it is equal to the goal.

### (2) Evaluate post-fix expressions using a stack

Now that we have generated all 480 post-fix expressions, we need to evaluate them to check if we've reached our goal number!

Post-fix operations are an efficient representation of expressions because they can be parsed and evaluated via standard stack operations.

I built my own very basic expression evaluator as a way to learn from scratch. The input to the evaluator is a post-fix expression to be evaluated represented as an array. [pop()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop) was used to retrieve tokens one by one from the stack.

The idea is simple, everytime you retrieve an operation (check if `isNan(token)` is `true`) then retrieve the next two numbers of the stack and perform the operation on. Repeat the process for each element in the stack. The result is a single number evaluated.

If the token from the stack is a number, then simply push it onto the stack so that it can be evaluated.

```javascript
const evaluate = (expr) => {
  let stack = [];
  expr.forEach((tok) => {
    let token = parseInt(tok, 10);
    if (isNaN(token)) {
      // is operator
      let operator = tok;
      // e.g. expr = [4, 2, -]
      //     stack = [4] -> [4, 2] -> [4, 2, -]
      //     popped: -, then 2 ('first') and then 4 ('second')
      //     e.g. stack.push(second-first) = stack.push(4-2);
      let first = stack.pop();   // would pop 2 ('first')
      let second = stack.pop();  // would pop 4 ('second')
      switch (operator) {
        case "+":
          stack.push(second + first);
          break;
        case "-":
          stack.push(second - first);
          break;
        case "*":
          stack.push(second * first);
          break;
        case "/":
          stack.push(second / first);
          break;
        case "^":
          stack.push(Math.pow(second, first));
          break;
        default:
          console.log('A problem has occurred.');
      }
    } else {
      // is number
      stack.push(token);
    }
  });
  return stack.pop();
};
```

Lastly, simply check if the resulting number is equivalent to the target that the user has in mind (e.g. 10) and display the result if so.

---

## Source code

See: [https://github.com/snjay/make10](https://github.com/snjay/make10)
