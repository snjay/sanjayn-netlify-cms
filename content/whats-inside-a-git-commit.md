---
title: "What's inside a git commit?"
date: 2021-02-21T20:24:20+11:00
draft: false
---

Git is a version control system (VCS) that helps you track progress of your repository over time. One of the most important parts of using git is the commit system.

> A **git commit** is a snapshot of a repository at some point in time.

One way to find the commits made to a repository is to run `git log`

```plain
$ git log
```

This command lists all commits made to the current branch. For example, here's an output which shows three commits made to a repository.

```plain {hl_lines=["3", "9", "15"]}
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

Every commit made to a repository is automatically assigned a commit id. The commit id is a 40 character long string uniquely identifying a specific commit.

```plain
f76461e80b3b8eb011f108d4083e99a807e967b3
```

When someone is learning git for the first time, they're often told to [memorize the magic commands](https://xkcd.com/1597/) without understanding what is happening underneath the hood with git. Therefore, the goal of this post is to uncover two aspects of git commits.

1. What the commit ids mean
2. Where commits and info about commits stored

## The git object database

To help keep track of your files across different commits, git uses an internal database called the **git object database**. The object database keeps track of your all your files as they change with every commit made to the repository.

The object database can be found at `.git/objects/` right inside your git repository! You can add/view/edit files in here with a little know-how.

### Git commit files

For example, a commit with id `f76461e80b3b8eb011f108d4083e99a807e967b3` would be stored in the object database at

```plain
.git/objects/f7/6461e80b3b8eb011f108d4083e99a807e967b3
```

While it may not be obvious just yet, but this file contains all the information you need about a commit itself. However, if you tried to open up the git object using conventional tools, you will be presented with unreadable text.

```plain
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

```plain
$ git cat-file -t f76461e80b3b8eb011f108d4083e99a807e967b3
commit
```

The `-t` flag prints out the object's type and in this case, `f76461e` is (obviously) a commit object!

If you use a `-p` flag, the command pretty-prints the contents of the git object.

```plain
$ git cat-file -p f76461e80b3b8eb011f108d4083e99a807e967b3
tree fc14c91fc160d0f2f2044f5b4443a90bfbe71a62
parent 6b28e17275dbf45958a3949af9d4c4247fab5472
author Sanjay Narayana <sanjay.narayana@hotmail.com> 1584704988 +1100
committer Sanjay Narayana <sanjay.narayana@hotmail.com> 1584704988 +1100

update documentation
```

* `tree fc14c91fc160d0f2f2044f5b4443a90bfbe71a62` is SHA-1 hash of the
* `parent 6b28e17275dbf45958a3949af9d4c4247fab5472` is the 

## How the commit id is created

Each git object can be a: (1) a blob, (2) a tree, (3) a commit or (4) a packfile[^1].

A 40 character id representing a git commit is actually a string that is a [SHA-1](https://en.wikipedia.org/wiki/SHA-1) hash calculated based on the following items:

1. Author – person who edited the files
2. Committer – person who created the commit[^2]
3. Commit message - a message on what/why the commit was made
4. Parent commit(s) SHA-1 hash
5. Source tree SHA-1 hash
6. File size - in bytes

Some of those might be familiar (i.e. the author, committer and the commit message) but the others might not be so familiar (i.e. the source tree, the parent commit).

If represented as a function, a commit SHA-1 id would look generating something like this.

```plain
sha1(
    file size (bytes),
    tree sha1,
    parent sha1,
    author,
    committer,
    commit message,
)
```

Each hash contains a 2 character header and a 38 character payload.

```plain
cada79aed28b2c45a69f2642f1b9ce00e8fca456
ca da79aed28b2c45a69f2642f1b9ce00e8fca456
```

The first two characters of a commit is a header, whilst the other 38 characters is the payload of the commit. The reason the first two characters form the parent directory is for efficiency reasons. By separating them out

https://stackoverflow.com/questions/30662521/advantages-of-categorizing-objects-into-folders-named-as-the-first-2-characters

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

[^1]: Packfiles are the fourth type of git object and won't be covered here Packfiles are an optimisation that help compress lots of files in the repo. They are created when `git gc` (git garbage collection) is run. This command only runs everytime you push to the server (it can also be run manually). It is an expensive operation so it is run very sparingly. The result however is a much smaller `.git/` folder.

[^2]: A git author ≠ a git committer. Since git history can be re-written, it's important the distinguish who created or edited the files originally (the 'author') and who made the commits (the 'committer').

## Summary

