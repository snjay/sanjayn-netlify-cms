---
title: Make 10
status: Published
date: '2019-03-28'
postFeaturedImage: /images/uploads/numbers.jpg
excerpt: Put in 4 numbers and a goal number to find all ways to reach the goal using +, –, × and ÷.
---

[![Demo](/images/demo.svg)](https://make10.sanjayn.com/) [![Source](/images/source.svg)](https://github.com/snjay/make10)


## "Can you make 10?"
Have you ever sat down on a train to have your friend poke you, point to the train's carriage number and ask, "Can you make 10?"

This project tells you how to make 10, given the 4 numbers in your train's carriage.

Infact, it's extensible to act as a solver to find an arithmetic solution to any sequence of 4 numbers and a goal.

## How does it work?
It boils down to two steps:

1. Generate all possible post-fix expressions involving the 4 numbers with the operations (+, –, x, ÷)
2. Evaluate each postfix operation by using standard stack operations and check if the result is equal to the goal

An additional constraint that I placed upon myself for this project was to implement all permutations and combinations library functions without using external mathematical libraries.  I initially wrote all the code in python using the wonderful [itertools](https://docs.python.org/3/library/itertools.html) library but wanted to write a pure client-side web version of it so I didn't need to spin up a server.

### (1) Generating all possible post-fix expressions
The first step is to generate a list of all possible expressions that are possible with the given train carriage numbers and the list of operations. Let us say the numbers in the train carriage are 1, 2, 3 and 4. Let us also suppose we are using the standard arithmetic operations used in the basic variant of the game  (+, –, x, ÷).

We initially generate all possible permutations of the train carriage numbers.

```
permutations = (numbers) => {
  if (numbers.length === 1) return [numbers];
  let perms = [];
  // Get all permutations for numbers without 
  //  including the first element
  let tail = permutations(numbers.slice(1));
  for (let i = 0; i < tail.length; i += 1) {
    const sub = tail[i];
    // Insert first number into every possible 
    //  position of sub-permutation.
    for (let j = 0; j <= sub.length; j += 1) {
      const pre = sub.slice(0, j);
      const mid = numbers[0];
      const post = sub.slice(j);
      perms.push(pre.concat([mid], post));
    }
  }
  return perms;
};
```

`permutations([1, 2, 3, 4])` returns a list of 24 (i.e. 4!) possible permutations:
```
[
  [1,2,3,4], 
  [2,1,3,4],
  ...
  [4,3,1,2],
  [4,3,2,1]
]
```

Next, we find the all combinations of operations that can be slipped between the numbers to find an answer. By definition, if you have 4 carriage numbers, you need to pick the 3 operations (with repetition) that will be placed between the numbers.

```
// return all combinations of the operators
// with repetition
operationsCombinations = (ops, r) => {
  return Array(r).fill(ops).reduce((a, b) =>
    a.map(x => b.map(y => x.concat(y))).reduce((a, b) => a.concat(b)));
};
```

The reason it is viable to generate all possible number & operation combination in the first place is because the sample space of all possibilities is quite small. For example, with 4 numbers permutations (i.e. 4! = 24) and 4 standard operations with 3 operations chosen with  [repetition](https://en.wikipedia.org/wiki/Combination#Number_of_combinations_with_repetition) (i.e. n=4, k=3 means 6C3 = 20) there are only 24 × 20 = 480  total evaluations that need to be performed.

Every number permutation and operator combination are weaved together to create a post-fix expression. For example, if the `numbers` array is `[1, 2, 3, 4]` and operators are `[+,-,×]`, then the resulting post-fix expression would be: `12+3-4×`.

```
postFix = (numbers, operations) => {
  let expr = [numbers[0]];
  let rest = numbers.slice(1);
  rest.forEach((r, i) => {
    expr = expr.concat([r, operations[i]]);
  });
  return expr;
};
```

### (2) Evaluate expressions using a stack
Now that we have generated all 480 post-fix expressions, we need to evaluate them to check if we've reached our goal number!

Post-fix operations are an efficient representation of expressions because they can be parsed and evaluated via standard stack operations.

I built my own very basic expression evaluator as a way to learn from scratch. The input to the evaluator is a post-fix expression to be evaluated represented as an array. [Array.prototype.pop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop) was used to retrieve tokens one by one from the stack. 

The idea is simple, everytime you retrieve an operation (check if `isNan(token)` is `true`) then retrieve the next two numbers of the stack and perform the operation on. Repeat the process for each element in the stack. The result is a single number evaluated. 

If the token from the stack is a number, then simply push it onto the stack so that it can be evaluated.

```
evaluate = (expr) => {
  let stack = [];
  expr.forEach((tok) => {
    let token = parseInt(tok, 10);
    if (isNaN(token)) {
      // is operator
      let operator = tok;
      // e.g. expr = [4, 2, -]
      //     stack = [4] -> [4, 2] -> [4, 2, -]
      //     popped: -, then (first) 2 and then 4 (second)
      //     stack.push(second - first) = stack.push(4-2);
      let first = stack.pop();   // would pop 2
      let second = stack.pop();  // would pop 4
      switch (operator) {
        case "+":
          stack.push(second + first);
          break;
        case "–":
          stack.push(second - first);
          break;
        case "×":
          stack.push(second * first);
          break;
        case "÷":
          stack.push(second / first);
          break;
        default:
          console.log('Parse error.');
      }
    } else {
      // is number
      stack.push(n);
    }
  });
  return stack[0];
};
```

Lastly, simply check if the resulting number is equivalent to the target that the user has in mind (e.g. 10) and display the result if so.

[![Demo](/images/demo.svg)](https://make10.sanjayn.com/) [![Source](/images/source.svg)](https://github.com/snjay/make10)
