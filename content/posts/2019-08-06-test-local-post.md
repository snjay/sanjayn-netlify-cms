---
title: Test local post
status: Featured / Published
date: '2018-03-27'
postFeaturedImage: /images/uploads/tim-marshall-155597.jpg
excerpt: >-
  Etiam ac quam eget lectus venenatis ullamcorper sit amet non arcu. Nullam
  interdum arcu vitae augue pulvinar sodales. Sed non dui diam. Quisque lectus
  est, lobortis ac efficitur vitae, posuere a mauris. Phasellus ac dui
  pellentesque, lacinia risus ut, imperdiet eros.
categories:
  - category: News
meta:
  canonicalLink: ''
  description: ''
  noindex: false
  title: ''
---
# /projects

Here are some things I've built and tinkered around with. Click on any of them to read a little bit more about them and a link to the source code and a demo.

# /projects/make10
[Demo](https://www.sanjayn.com/numbers)
[Source](https://github.com/snjay/train-game)

## "Oi mate, can you make 10?"
Have you ever sat down on a train to have your friend poke you, point to the train's carriage number and ask, "Oi mate, can you make 10?"

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
operationsCombinations = (ops, r) => {
  return Array(r).fill(ops).reduce((a, b) =>
    a.map(x => b.map(y => x.concat(y))).reduce((a, b) => a.concat(b)));
};
```

The reason it is viable to generate all possible number & operation combination in the first place is because the sample space of all possibilities is quite small. For example, with 4 numbers permutations (i.e. 4! = 24) and 4 standard operations with 3 operations chosen with  [repetition](https://en.wikipedia.org/wiki/Combination#Number_of_combinations_with_repetition) (i.e. n=4, k=3 means 6C3 = 20) there are only 24 x 20 = 480  total evaluations that need to be performed.

### (2) Evaluate expressions using a stack

# /projects/birds
