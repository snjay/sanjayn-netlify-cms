---
title: "What's inside a git commit?"
date: 2021-03-04T11:04:20+11:00
tags: ['git', 'sha-1']
draft: false,
showCoffee: true
---

![commits-image](https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2110&q=80)

Git is a version control system (VCS) that helps you track progress of your repository over time. One of the essential parts of using git is learning the commit system.

However, when someone learns git and the commit system for the first time they are told to **[✨memorize the magic commands✨](https://xkcd.com/1597/)**, without understanding what's happening under the hood. So the goal of this post is to dig deeper and understand:

1. [How commits are stored internally](#1-how-commits-are-stored-internally)
2. [What information a commit stores](#2-what-information-a-commit-stores)
3. [How commit ids are generated](#3-how-commit-ids-are-generated)

This post will not be talking about how to use git. It will be looking at the underlying internals of git. Thus, this post assumes  you are familiar with using git and the command line. If not, I recommend [Atlassian's git tutorials](https://www.atlassian.com/git/tutorials) to get started :)

## 1. How commits are stored internally

The short answer is that a commit is a text file stored within the `.git/objects` directory. Git stores this file with all the information about a commit: who made it, when it was made, the state of the directory and some other metadata.

The long answer involves understanding the things which go into making up what a 'commit' is.

### Git's Object Database

To keep track of your files, git uses an internal database called the **object database**. This database is in the `.git/objects` directory and is at the core of what drives git!

#### What does the database store?

The database stores three types of objects. Technically there are four, but we will ignore [tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging) in this post. Starting from the simplest and moving up to the most complex, they are:

1. Blob objects (Simplest)
2. Tree objects
3. Commit objects (Complex)

Commit objects are the most complex because they house blob objects and tree objects inside them. So, to understand commit objects we need to venture to the land of blob objects first. Then, tree objects and then move onto commit objects last.

### Blob objects

A **blob object** represents a single file in the working directory. The acronym stands for '**b**inary **l**arge **ob**ject' and is the simplest object type that git deals with.

When a single file is added to the object database, git stores the file as a blob in the database.

#### Creating a blob object

Let's run a quick example and see this happening in action. Say we're building a repository to store quotes from the 2003 cult-classic movie, The Room.

```text
$ mkdir the-room-quotes && cd $_
$ git init

$ echo Hi doggy! > quote1.txt
```

Creating a new file in the working directory does not add it into the object database. We can check the object database to see that it is empty:

```text
$ find .git/objects -type f
( should be empty )
```

#### Write blob into object database

In order to write objects into the database, we have to add this file to the staging area using 'git add'. The **staging area** is a middle-ground between the working directory and .git directory. If you add a file using `git add` you would be moving it from the current working directory into the staging area.

![add-to-staging-area](/stages-add.png)

```text
$ git add .
```

```text {hl_lines=[2]}
$ find .git/objects -type f
.git/objects/7a/aeff605349ee86ab6ed6f9d70ce5a617b596e9
```

It seems a new object has appeared in the database. But what's inside it?

#### Viewing an blob's contents

Do not attempt to open these files using commands such as 'cat', because they are compressed using `zlib`. Instead use `git cat-file -p <id>` if you'd like to take a look inside the file.

```text
$ git cat-file -p 7aaeff605349ee86ab6ed6f9d70ce5a617b596e9
Hi doggy!
```

> _Note: 'git cat-file' is not a command you'd use often when using git, it is an internal helper function. There are other types of these helpers, called 'plumbing' commands. For more information take a look at: [Plumbing and Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)._

### Tree objects

**Git trees** are a grouping of files to represent the state of the working directory. Trees store a _snapshot_ of the entire working directory.

Blobs are cool, but you want to do more than write a bunch of single files to your repository, right? There needs to be some way of grouping a bunch of files to call it your 'working directory.' This is what the second type of object: git trees do.

A common misconception about git is that it only stores the changes with every commit made. **This is not true.** Git actually stores a snapshot of the entire working directory at the time of the commit made.

#### Similarity to UNIX tree-like structure

Git borrows from UNIX's tree-like file system to take a snapshot of your working directory. When creating a tree, git starts from the root directory to begin classifying files. Files in the root directory are recorded as blob objects, and sub-directories are recorded as tree objects. For all sub-directories, git repeats the same operation until reaching the bottom-most directory. After finishing up, the hierarchy of your working directory will look like a 'tree.'

#### Adding in more files

Currently, only one file is in our working directory. If we were to create a tree at this point it would look something like this.

![tree-one-object.png](/tree-one-object.png)

Let's add (and stage) a few more files and sub-directories before we create a tree.

```text
$ echo You are just a chicken, cheep cheep cheep cheep > quote2.txt
$ git add .
```

There are now two objects in the database. The new object represents the new file we added to the staging area. Our hypothetical tree object would look like this.

![tree with two blobs](/tree-two-objects.png)

```text {hl_lines=[1]}
.git/objects/8a/f3792c43bba0018127f036a6717c508e4b9cea
.git/objects/7a/aeff605349ee86ab6ed6f9d70ce5a617b596e9
```

Let's add a third quote inside a sub-directory. The new sub-directory is only for quotes from the movie directed towards Mark.

```text
$ mkdir to-mark
$ echo Ha ha ha what a story Mark > to-mark/quote3.txt
$ git add .
```

```text {hl_lines=[1]}
.git/objects/94/52e922fdbfa6ecabd62fd29fec3e821625c5f6
.git/objects/8a/f3792c43bba0018127f036a6717c508e4b9cea
.git/objects/7a/aeff605349ee86ab6ed6f9d70ce5a617b596e9
```

#### Creating the tree

Now that we have some extra files and sub-directories, we can create a tree to store a snapshot of the repo's hierarchy:

```text
├── quote1.txt
├── quote2.txt
└── to-mark
    └── quote3.txt
```

To create a tree, we can use the `git write-tree` command. This command creates a tree based on the files currently in the staging area and outputs the tree's id.

```text {hl_lines=[2]}
$ git write-tree
d77cacbb84e5369b537cd62d26d533e04798fab1                 <--- root tree id
```

```text {hl_lines=[2, 3]}
.git/objects/94/52e922fdbfa6ecabd62fd29fec3e821625c5f6
.git/objects/9c/8563e58a379f1f3e5366075401ea9a6f470591    <--- ?
.git/objects/d7/7cacbb84e5369b537cd62d26d533e04798fab1    <--- root tree object
.git/objects/8a/f3792c43bba0018127f036a6717c508e4b9cea
.git/objects/7a/aeff605349ee86ab6ed6f9d70ce5a617b596e9
```

Hang on. There's two new objects in the database when we created a tree?

- We know 'd7/7cacbb84e5369b537cd62d26d533e04798fab1' is the root tree for the entire repository (what was returned as the output to the 'write-tree' command).
- '9c/8563e58a379f1f3e5366075401ea9a6f470591' is the tree created to represent the new sub-directory for quotes directed to Mark.

Remember that git starts creating the tree from the root directory. It moves downwards and marks any sub-directories as separate tree objects . Thus, '9c/8563e58a379f1f3e5366075401ea9a6f470591' was created to capture the sub-directory called 'to-mark' inside our repo.

#### Looking inside the tree objects

If we take a look at the root tree object ('d77cacb'), we can see the two blobs and a tree inside it.

```text
$ git cat-file -p d77cacb
100644 blob 7aaeff605349ee86ab6ed6f9d70ce5a617b596e9    quote1.txt
100644 blob 8af3792c43bba0018127f036a6717c508e4b9cea    quote2.txt
040000 tree 9c8563e58a379f1f3e5366075401ea9a6f470591    to-mark
```

> _Note: `d77cacb` is the shortened version of the longer hash. You can also use short hashes in place of long hashes as long as you supply enough characters. See the [Short SHA-1](https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection) section for more information._

Looking at the first row of the output,

- 100644 is borrowed from UNIX, meaning the object is in normal file mode.
- blob is the type of the object.
- 7aaeff605349ee86ab6ed6f9d70ce5a617b596e9 is the id of the file.
- quote1.txt is the name of the file inside the tree

The last line's output points to another tree. This other tree is the sub-directory we created to store Mark's quotes. If we look inside the sub-directory tree ('9c8563e'), it shows the single 'quote3.txt' file.

```text
$ git cat-file -p 9c8563e
100644 blob 9452e922fdbfa6ecabd62fd29fec3e821625c5f6    quote3.txt
```

This is what trees store: snapshots of the working directory.

**If trees store a snapshot of the working directory, what exactly do commits store?**

### Commit objects

A git commit is a snapshot of a repository at a _point in time_. Commits wrap around a tree object with info about when it was created, who created it and why it was created.

#### Create a commit

We can create a commit based on a tree by using the `commit-tree` command. We'll also pipe in the commit message for the commit via stdin.

```text {hl_lines=[2]}
$ echo 'Wrote three quotes' | git commit-tree d77cacb
5edebefd8e30ffd4bd13ab713689a1b66a62ad7d                <-- commit id
```

> _Note: If you're following the terminal commands - the commit id will be different for you. This is because the metadata involved in creating the id will be different between your repository and mine. The upcoming section explains why this is the case._

The result is the commit id, which happens to be another object in the database:

```text {hl_lines=[5]}
.git/objects/94/52e922fdbfa6ecabd62fd29fec3e821625c5f6
.git/objects/9c/8563e58a379f1f3e5366075401ea9a6f470591
.git/objects/d7/7cacbb84e5369b537cd62d26d533e04798fab1
.git/objects/8a/f3792c43bba0018127f036a6717c508e4b9cea
.git/objects/5e/debefd8e30ffd4bd13ab713689a1b66a62ad7d   <-- commit object
.git/objects/7a/aeff605349ee86ab6ed6f9d70ce5a617b596e9
```

Also let's make sure the current master branch points to this commit as the first commit. Usually `git commit` would set this, but this is not the case when using internal plumbing commands.

```text
$ git update-ref refs/heads/master 5edebef
```

## 2. What information a commit stores

The commit object is like any other object in the database: a file. This file can be opened up to see what is inside it. We can look inside the commit object ('5edebef') using the `git cat-file` command. This will let us see what information it stores.

```text
$ git cat-file -p 5edebef
tree d77cacbb84e5369b537cd62d26d533e04798fab1
author Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100
committer Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100

Wrote three quotes
```

This is the output of the commit object file inside the database. You might notice some familiar friends inside the commit object! Others will be new.

- tree d77cacbb84e5369b537cd62d26d533e04798fab1 refers to the tree object created earlier.
- author is whoever edited the files.
- committer is the person who created the commit.
- 'Wrote three quotes' is the commit message written at the time the commit was created. This will be different if your commit message was different.

The reason author and a committer are separate is because these can be two separate people. The distinction is only made clear when running commands such as [git format-patch](https://git-scm.com/docs/git-format-patch), [git commit --amend](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---amend) or [git merge](https://git-scm.com/docs/git-merge). These commands re-write history. If history is editable, then both the author of the commit _and_ the committer should be credited for their separate work.

Another entry not visible here, is 'parent'. Every new commit made sets it's parent commit as the previous commit made on the current branch. This linking allows every commit to link back to the previous commits made. Following this chain of commits back through time can get you back to the initial commit. The reason it is not visible here is because this is the first commit made to this repository. The first commit does not have a parent commit.

Commits signed with a GPG key will also contain a signature below the commit message,

```text {hl_lines=["6-11"]}
tree d77cacbb84e5369b537cd62d26d533e04798fab1
author Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100
committer Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100

Wrote three quotes
gpgsig -----BEGIN PGP SIGNATURE-----
hM1/PswpPLuBSr+oCIDj5GMC2r2iEKsfv2fJbNW8iWAXVLoWZRF8B0MfqX/YTMbm
...
8S5B/1SSQuEAjRZgI4IexpZoeKGVDptPHxLLS38fozsyi0QyDyzEgJxcJQVMXxVi
=FSES
-----END PGP SIGNATURE-----
```

**When we create commits, git seems to spit out a series of random letters and numbers for the commit's id. What do these mean, and how are they made?**

## 3. How commit ids are generated

The **commit id** is a 40 character long string uniquely identifying a commit made to the repository. A commit id is the result of a SHA-1 hash of a header and the commit file's contents ('data').

### Introducing SHA-1

**[SHA-1](https://en.wikipedia.org/wiki/SHA-1)** is a hashing algorithm which works by taking in an some input and spitting out a 160-bit (40-characters) hash. It is **one-way function**, which means it is easy to convert an input into a hash, but difficult to find the input given the hash.

SHA-1 is part of a family of cryptographic hashing functions which are generally only found in cryptography or security scenarios. However SHA-1 wasn't initially chosen by Linus Torvalds for it's cryptographic properties. It was chosen because it was considered [a good hash](https://www.youtube.com/watch?v=4XpnKHJAok8&t=56m16s) for verifying data integrity.

Since the [2017 SHAttered attack](https://shattered.io/) which found a way to practically generate SHA-1 collisions, future versions of Git (v2.13.0 and up) moved to using a [stronger version of the SHA-1](https://git-scm.com/docs/hash-function-transition/)  implementation to deal with the collision attack.

### How to create a commit id

The commit id is the SHA-1 hash of: (1) a header, (2) a null terminator and (3) a data payload.

![commit id formula](/commit-id-formula.png)

- 'header' consists of the word "commit" and the size of the data in bytes.
- 'data' is the contents of the git object file exactly how it is shown in the previous section ([2. What information a commit stores](#2-what-information-a-commit-stores)). This information in this includes (1) author: the person who edited the files, (2) committer: the person who made the commit, (3) creation time, (4) a commit message: a message on the purpose of the commit, (5) parent commit sha1 and the (6) tree SHA-1 hash.

When creating a new commit (say using `git commit`), git calculates the 'header' and 'data' at that point in time, and then runs it through the SHA-1 function to generate the commit id.

### Replicating any repository's latest commit id

To best understand how the commit id is made, let's re-create the latest commit id in a repository. 

You can follow along by navigating to any repository with git. For this post, I'll be replicating the latest commit id I created in my dummy repository which is `5edebefd8e30ffd4bd13ab713689a1b66a62ad7d`.

#### Form the header and data

As per the input to the SHA-1 function, we need to form the 'header' and the 'data' of the input. First we will create the 'data', because the header requires it to calculate the size of it.

```text
$ data=$(git cat-file commit HEAD)
```

```text
$ echo $data
tree d77cacbb84e5369b537cd62d26d533e04798fab1
author Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100
committer Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100

Wrote three quotes
```

- The expression inside the $(), `git cat-file commit HEAD` returns contents of the latest commit of the current branch.

```text
$ header=$(printf "commit %s" $(echo $data | wc -c))
```

```text
$ echo $header
commit 189
```

- The `wc -c` piped in after the 'echo $data' calculates the number of bytes of the data.

Let's take a look at how the input to the SHA-1 will look. The input is the header and the data variables, with a "\0" between them.

```text
$ echo $header"\0"$data
commit 189 tree d77cacbb84e5369b537cd62d26d533e04798fab1
author Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100
committer Tommy Wiseau <t.wiseau@theroom.com> 1615298875 +1100

Wrote three quotes
```

> _Note: The "\0" is not visible in the shell output._

#### Hash the input with SHA-1

Finally, we pipe this input into the SHA-1 command. Use `shasum` (or `sha1sum` if you are on Linux) and the output will be the commit id of our latest commit. Ta da!

```text
$ echo $header"\0"$data | shasum
5edebefd8e30ffd4bd13ab713689a1b66a62ad7d  -
```

Whilst the data would be different for you when git creates a commit, this is how git generates this commit id. The  `write_object_file_prepare` function in the git source code calculates this hash. You can take a look at the source code [here](https://github.com/git/git/blob/master/object-file.c#L1729-L1733) if interested.  

### Why are commit object files stored in two character sub-directories?

An observation you may have made is that objects in the database look different to the commit ids/hashes used. The hash is a 40-length string. But, the database object is the first two characters as a sub-directory. Then last hash's last 38 characters is the file name.

```text
5edebefd8e30ffd4bd13ab713689a1b66a62ad7d                  <-- commit id
.git/objects/5e/debefd8e30ffd4bd13ab713689a1b66a62ad7d    <-- git object file ('loose object')
```

The structure of the object database looks like the following. Objects stored like this are called '**loose objects**.'

```text {hl_lines=[2,3]}
.git/objects
├── 5e
│   └── debefd8e30ffd4bd13ab713689a1b66a62ad7d
├── 7a
│   └── aeff605349ee86ab6ed6f9d70ce5a617b596e9
├── 8a
│   └── f3792c43bba0018127f036a6717c508e4b9cea
├── 94
│   └── 52e922fdbfa6ecabd62fd29fec3e821625c5f6
├── 9c
│   └── 8563e58a379f1f3e5366075401ea9a6f470591
├── d7
│   └── 7cacbb84e5369b537cd62d26d533e04798fab1
├── info
└── pack
```

There are a few answers for the different formats between the commit id (hash) and the database object.

1. **Sub-directory limits:** Some older file systems only allow a certain number of files in a directory. For example, [ext-2](https://en.wikipedia.org/wiki/Ext2#File-system_limits) and [ext-3](https://en.wikipedia.org/wiki/Ext3#Disadvantages) allow a maximum of ~32k sub-directories within a directory. Reaching this limit can occur quite quickly for large git repositories. The cool thing about SHA-1 is that it distributes it's hashes well (even across the first two letters) which means it can splay the individual files across the sub-directories without putting too many of the files into the same two-character bucket.

2. **Efficiency:** Git relies on the object database to store and retrieve most git objects. Efficient access to these files keeps git fast.

Think about the situation that git _doesn't_ store files inside 2-character sub-directories. Instead, it would have to place all loose objects into the root `.git/objects` directory. Every time git wants to find an object using an id, it would need to perform a linear scan of the entire directory. Adding a layer of separation, limits the initial search space to a maximum of 256 (2^16) sub-directories.

## Resources

Here are a collection of resources if you'd like to learn more about git commits.

- Replicating the SHA-1 commit id: https://gist.github.com/masak/2415865
- Plumbing and Porcelain: https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain
- Short ids: https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection

_Thanks for reading!_
