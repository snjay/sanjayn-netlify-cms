---
title: "What's inside a git commit?"
date: 2021-02-21T20:24:20+11:00
draft: false
---


Git is a version control system (VCS) that helps you track progress of your repository over time. One of the most important parts of using git is the commit system.

When someone is learning git for the first time, they're often told to [memorize the magic commands](https://xkcd.com/1597/) without understanding what happens underneath the hood. Therefore the goal of this post is to dig a litter deeper, and understand two things about commits:

1. How commits are represented internally
2. What the commit ids mean and how they are generated

## The git object database

The simplest explanation of a commit is that it is a plaintext file located in the git object database which stores some extra metadata at the time you made the commit. This plaintext file is stored internally by git and contains all the info about a commit including when it was made, who made it and how the repository looked like. But what exactly does this mean? What is the git object database, and where exactly are these files you talk about stored?

The long answer is that in order to keep track of your files across different commits, git uses an internal database called the **git object database**. There are three[^1] types of objects that are stored in the database from simplest to most complex are:

1. Blob objects
2. Tree objects
3. Commit objects

The object database can be found in `.git/objects` folder within a git repository. This database is responsible for keeping track of the working directory across every commit made - it's the engine that drives git.

Let's start with the simplest object type (blobs) and slowly work our way up to commits.

### Blobs

**Blobs** represent single files stored in the working directory.

Blobs are the simplest object type that git deals with. Git stores the data for individual files by hashing the contents of the file and then storing that  hash to represent the file.

Let's run a quick example.

```text
$ mkdir test && cd test/
$ echo mangoes are great > YOUR_FILE_NAME
```

Then, let's stage our files and observe what happens to the `.git/objects/` directory.

```text
$ git init
$ git add .
$ find .git/objects -type f
.git/objects/bb/6f156e3e1b09ba7879c06a5a01844c042ef95e
```

It's important to remember that git is a **content-addressable systen** meaning a file is unique if it's _contents_ are unique. Irrespective of what file name you used in place of `YOUR_FILE_NAME`, you will end up with the same git object file as above. This is what content addressable means, it means that git generates the object id based on the contents of the file, and not the file's name.

### Trees

But you want to do more than just write a single file to your repository right? Maybe you even want to add multiple files or go and add something real fancy called '_folders_'. Wow. Well you're in luck because the second type of object in the database are git trees.

**Git trees** represent a group of files together.

Git borrows heavily from UNIX tree-like file structure to represent the group of files. What this means is that a tree can point to either (1) a blob or (2) a sub-tree. Individual files are represented as blobs, whilst directories are represented as a sub-tree themselves.

A tree can only be created once your files are in the staging area. The staging area is a middle-ground between your working directory and the actual .git directory. Think of it as a sort of like a real-life 'stage' - you would put the files you wish to commit onto this stage.

![img](https://git-scm.com/book/en/v2/images/areas.png)

Currently only one of our files is staged, we can check what is staged by running `git status`. 

```
$ git status
xxx
```

How about we create another file and stage it.

```plain
$ echo mangoes2 > file2.txt
$ git add .
$ find .git/objects -type f
.git/objects/3b/da87e5cf72eada744b504213d49357b3a37b00
.git/objects/01/bf8f94800cafb22f589104b3c6a9743c84b053
```

As you can see, there are now two objects in the database, each of these represent the two files we created. You can use a neat little git helper command called `git cat-file` to view these files. The `-t` flag prints out the object's type. In this case, `3bda87e5cf72eada744b504213d49357b3a37b00` is a blob. If you use a `-p` flag, you can pretty-print the contents of the git object too. (Don't try open these files using a regular `cat` command because the contents of these plain text files are compressed with `zlib`).

```plain
$ git cat-file -t 3bda87e5cf72eada744b504213d49357b3a37b00
blob
$ git cat-file -p 3bda87e5cf72eada744b504213d49357b3a37b00
mangoes are great
```

To create a tree to bundle up our two files together, we use `git write-tree`. This command creates a tree based on the currently staged files.

```
$ git write-tree
a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
$ find .git/objects -type f
.git/objects/3b/da87e5cf72eada744b504213d49357b3a37b00
.git/objects/01/bf8f94800cafb22f589104b3c6a9743c84b053
.git/objects/a6/dfdfda8182ac27a4f7ec9a3ef7fea562008686
```

As you can see, there are now three git objects - the newest one being the tree object itself (`hash`).

This brings us to the commit object.

## Commits

Blobs store individual files. Trees help store the entire working directory together, so what are commits then?

A **git commit** is a snapshot of a repository at some point in time - along with other crucial information.

Commits essentially store the _metadata_ related to the tree you've created.

---

## Commit ids

One way to find the commits made to a repository is to run `git log`. This command lists all commits made to the current branch. For example, here's an output which shows three commits made to a repository.

```console {hl_lines=["3", "9", "15"]}
$ git log
commit f76461e80b3b8eb011f108d4083e99a807e967b3
Author: Sanjay Narayana <sanjay.narayana@hotmail.com>
Date:   Fri Mar 20 22:49:48 2020 +1100

    update documentation

commit 6b28e17275dbf45958a3949af9d4c4247fab5472
Author: Sanjay Narayana <sanjay.narayana@hotmail.com>
Date:   Fri Mar 20 22:36:19 2020 +1100

    add more info to readme

commit 22935be777f4cfaff52fb321a428cbb43d47f8a2
Author: Sanjay Narayana <sanjay.narayana@hotmail.com>
Date:   Fri Mar 20 22:25:18 2020 +1100

    add .gitignore
```

Every commit made to a repository is automatically assigned a commit id (sometimes called the 'object id' or **oid** for short). This id is a 40 character long string which uniquely identifies a single commit. For example, the latest commit from the output above is `f76461e80b3b8eb011f108d4083e99a807e967b3`. But the question is what do these ids actually mean?

---

### Where commits are located

Commits are a type of object that git stores within its object database. As mentioned earlier this is stored in the `.git/objects` folder. If you try to look at the files inside this directory, you won't notice your own working directory files, but instead you'll find a bunch of two-character directories and some other files inside of each of those. 

Every commit has a respective file in the object database. To find the file that represents a commit, you'll have to look for it in a specific way. The file that represents commit id `f76461e80b3b8eb011f108d4083e99a807e967b3` would be at

```text
.git/objects/f7/6461e80b3b8eb011f108d4083e99a807e967b3
```

It may not be obvious just yet, but this file contains all the metadata about the commit itself. However, if you try to open up the git object using conventional tools, you will be presented with unreadable text.

```console
$ cat .git/objects/f7/6461e80b3b8eb011f108d4083e99a807e967b3
x��M
�0`�9��
       %I_�D<���G+&)1]������0�k�K�쩷!y�ފ#&x�IrĤ"�d�K.jA�d+�X:LN�(��*���*C�EK��(Q'r
�d��6xPy�wj�S!���0����3-���|�
                             j��8
                                 �9;����El[��-G�/���6T�%
```

Why is this happening? It's because git objects are compressed with `zlib` to help save storage.

If we _do_ wish to work with this git object file, we can use a handy command that git gives us called `git cat-file`.

```console
$ git cat-file -t f76461e80b3b8eb011f108d4083e99a807e967b3
commit
```

The `-t` flag prints out the object's type. In this case, `f76461e` is a commit object.

If you use a `-p` flag, you can pretty-print the contents of the git object too.

```shell
$ git cat-file -p f76461e80b3b8eb011f108d4083e99a807e967b3
tree fc14c91fc160d0f2f2044f5b4443a90bfbe71a62
parent 6b28e17275dbf45958a3949af9d4c4247fab5472
author Sanjay Narayana <sanjay.narayana@hotmail.com> 1584704988 +1100
committer Sanjay Narayana <sanjay.narayana@hotmail.com> 1584704988 +1100

update documentation
```

Let's break each of these down to explain what they mean.  

`parent 6b28e17` simply refers to the commit id of the current commit's parent commit. Every commit has 1 or more parent commits which it refers to, this what allows you to trace commits back across time. When you create a commit on a branch, the previous commit is automatically assigned as the parent of the new commit which allows it to be linked to the list of commits previously. Following this chain of commits back will get you back to the first commit which has no parent commit to begin with.

The `author` refers to the individual which edited the files for this commit, whilst the `committer` is the person who actually created the commit. The reason a distinction is made between an author and a committer is because these can technically be two separate individuals. The distinction is only made when git history is edited or re-written with a command such as [git format-patch](https://mirrors.edge.kernel.org/pub/software/scm/git/docs/git-format-patch.html) or [git commit --amend](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---amend). If history is edited, then both the author of the commit _and_ the committer can be credited for their work.

`update documentation` is the commit message that was written at the time the commit was created. This will obviously different for your commits.

The `tree fc14c91` is a pointer its root tree, representing the state of the working directory at that time. This tree object actually holds the whole repository's contents at the point of time the commit was made (this is why it's called a _snapshot_).

### Git trees

Git trees are another type of object stored in the `.git/objects` directory so it can also be queried. Git trees are a data structure used to store files and directories in a similar way to UNIX inodes. Each object inside a git tree can either refer to a blob (a simple data file) or another tree (called a 'subtree').

For example, if we wish to look at `tree fc14c91`, we can find it in the git object directory just like we found the commit object. Except this time it's of type 'tree' and the contents of the tree object looks slightly different.

```shell
$ git cat-file -t fc14c91fc160d0f2f2044f5b4443a90bfbe71a62
tree

$ git cat-file -p fc14c91fc160d0f2f2044f5b4443a90bfbe71a62
100644 blob 46c97458e0d20b491f98f4d590c9e4df02032b70    .gitignore
100644 blob 43419f9c96dd5a02ac870adf410020000a706eea    2-body-sim.gif
100644 blob c5010b01390bb1e1077f179e822518635888a309    README.md
100644 blob b5c0e97d52f525f5c97793f7f8bbfb562feee807    ncurses-sim.py
100644 blob 70ee571a7ef45f227f7c56146a16af707b2ad64d    simulation.py
100644 blob e7e798b3fd69d490dec71fedee117cc039491f7b    smooth.py
```

## How the commit id is created

The git commit id you are familiar with is actually a [SHA-1](https://en.wikipedia.org/wiki/SHA-1) hash. If expressed as a function, the commit id is calculated as a function of (1) the header, (2) the size of the content (in bytes), (3) a null terminator and (4) the data payload.

```plain
commit_id = sha1(header + "\0" + data)
```

The data contains

1. Author – person who edited the files
2. Committer – person who made the commit[^2]
3. Commit message - a message on what/why the commit was made
4. Parent commit(s) SHA-1 hash
5. Source tree SHA-1 hash
6. File size - in bytes

### Generating your _own_ commit id hash

- Example of creating a hash
- Optional: Find the source code of _where_ this is happening
- Manually commit (with git commit-tree)
- Why git objects are stored in 2-letter directory prefixes
- Hash chaining for integrity

### Hash chaining

The awesome thing about using an SHA-1 to represent git commits is the 

```plain
$ git checkout d34b4065d5b8829cbdd71ebcda76215e4efd4530

Note: switching to 'd34b4065d5b8829cbdd71ebcda76215e4efd4530'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -c with the switch command. Example:

  git switch -c <new-branch-name>

Or undo this operation with:

  git switch -

Turn off this advice by setting config variable advice.detachedHead to false

HEAD is now at d34b4065d Merge pull request #1 from user/repo
```

---

Each hash contains a 2 character header and a 38 character payload.

```plain
cada79aed28b2c45a69f2642f1b9ce00e8fca456
ca da79aed28b2c45a69f2642f1b9ce00e8fca456
```

The first two characters of a commit is a header, whilst the other 38 characters is the payload of the commit. The reason the first two characters form the parent directory is for efficiency reasons. By separating them out

https://stackoverflow.com/questions/30662521/advantages-of-categorizing-objects-into-folders-named-as-the-first-2-characters

---

## Peering into `.git/`

Inside every git repository, you'll find a directory called `.git/` called the **git database**

There are essentially four types of objects used in git.

1. Blob
2. Trees
3. Commits

## Blobs

Represents a single file, git initially stores data by hashing the contents of a file and stores the hash of the contents of the file to represent the file.

## Trees

But you want to do more than just write single files right? Git trees represent a collection of files together. This grouping is similar to how UNIX has directories and inodes for individual files.

A git tree is a SHA-1 hash pointing to the root of a tree object. Each tree objects is stored in a similar fashion to a UNIX filesystem. The tree can point to either (1) another sub-tree or (2) a blob file containing raw content. The tree represents the contents of commit, which is a snapshot of the directory so that it may be traversed and recovered if/when necessary.

Every tree contains 1 or more entries within it. Each of the entries is the SHA-1 hash of the blob OR the sub-tree (using the correct mode type and filename).

## Commits

## If commits store _snapshots_ of the whole directory, why isn't the .git/ folder huge?

Let's walk through an example.

> Modify a file and calculate file size

[^1]: There is a fourth object type called a 'packfile.' Packfiles won't be covered here but simply put they are an optimisation which helps compress lots of files in the repo. They are created when `git gc` (git garbage collection) is run and/or you push to the server. The result however is a much smaller `.git/` folder and object database.

[^2]: A git author ≠ a git committer. Since git history can be re-written, it's important the distinguish who created or edited the files originally (the 'author') and who made the commits (the 'committer').

## Summary

