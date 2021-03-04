---
title: "What's inside a git commit?"
date: 2021-03-04T11:04:20+11:00
tags: ['git', 'sha-1']
draft: false
katex: true
showCoffee: true
---

![commits-image](https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2110&q=80)

Git is a version control system (VCS) that helps you track progress of your repository over time. One of the most important parts of using git is the commit system.

When someone learns git, they’re told to **[✨memorize the magic commands✨](https://xkcd.com/1597/)**, often without knowing what's happening under the hood. So the goal of this post is to dig deeper and understand:

1. How commits are represented internally,
2. What commit ids mean, and
3. How commit ids are generated

## The git object database

The easiest way to explain a commit is that it is a text file stored within the `.git/objects` folder. Git stores the file with all the info about a commit: who made it, when it was made and the state of the directory.

The long answer involves a few moving parts. To keep track of your files (across all your commits), git uses an internal database called the **git object database**. The database doesn't track your current directory, but also your directory when you made previous commits too.

The database stores three[^1] types of objects. Starting from from simplest to most complex they are:

1. Blob objects
2. Tree objects
3. Commit objects

The `.git/objects` directory houses the database for a git repository. This database keeps track of the directory across every commit made - it’s at the core of what drives git!

Let’s start with the simplest object type: **blobs**, and work up to **commits**.

### Blobs

**Blobs** represents a single file stored in the working directory. The acronym stands for '**b**inary **l**arge **ob**ject' and is the simplest object type that git deals with.

When a single file is added to the object database (e.g. `file.txt`), git stores the file as a blob in the object database. Let's run a quick example and see this happening in action. Replace `YOUR_FILE_NAME` with any file name you'd like.

```text
$ mkdir test && cd test

$ echo "mangoes are great" > YOUR_FILE_NAME
```

Next, let's add our files using 'git add' to the staging area, and then take a peek in the object database at `.git/objects/`.

```text
$ git init
$ find .git/objects -type f
// should be empty

$ git add .
$ find .git/objects -type f
.git/objects/bb/6f156e3e1b09ba7879c06a5a01844c042ef95e
```

It seems a new object has appeared in the database. Take a look at the output from the last command above with the output you have, they should be the same.

How is this possible? It's because git is a **content-addressable system**. If the object stored in the db is the same irrespective of what we named the file, it means git isn't looking at the name of the file to create the object. It's actually looking at the contents of the file.

Do not attempt to open these files using commands such as 'cat', because they are compressed using `zlib`. Instead use `git cat-file -p <file>` if you'd like to take a look inside the file. 

```text
$ git cat-file -p bb6f156e3e1b09ba7879c06a5a01844c042ef95e
mangoes are great
```

This should show the contents of our file we created.

_Note: 'git cat-file' is not a command you'd use often, it is an internal helper function. There are other types of these helpers, called 'plumbing' commands. For more information take a look at: [Plumbing and Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)._

**What is the staging area?**

You might ask what I meant by the 'staging area' when adding git files with 'git add'. The staging area is a middle-ground between the working directory and .git directory. If you add a file using `git add` you would be moving it from the current working directory into the staging area.

![add-to-staging-area](/stages-add.png)

Think of it as a real-life 'stage', you're presenting whatever files you wish to commit up onto the stage.

### Trees

But you want to do more than write a single file to your repository, right? You might even venture out and add a fancy thing called 'folders'? Unbelievable.

Well it's your lucky day because the second type of object in the database are git trees.

**Git trees** represent a group of files together.

Git borrows heavily from UNIX tree-like file structure to represent the group of files. What this means is that a tree can point to either (1) a blob or (2) a sub-tree. Individual files are represented as blobs, whilst directories are represented as a sub-tree themselves.

A tree can only be created once your files have been placed into in the staging area. Currently only one of our files are staged, we can confirm this with `git status`.

```text
$ git status
xxx
```

How about we create another file and stage it.

```text
$ echo mangoes2 > file2.txt
$ git add .
$ find .git/objects -type f
.git/objects/3b/da87e5cf72eada744b504213d49357b3a37b00
.git/objects/01/bf8f94800cafb22f589104b3c6a9743c84b053
```

As you can see, there are now two objects in the database, each of these represent the two files we created. You can use a neat little git helper command called `git cat-file` to view these files. The `-t` flag prints out the object's type. In this case, `3bda87e5cf72eada744b504213d49357b3a37b00` is a blob. If you use a `-p` flag, you can pretty-print the contents of the git object too. (Don't try open these files using a regular `cat` command because the contents of these plain text files are compressed with zlib).

```text
$ git cat-file -t 3bda87e5cf72eada744b504213d49357b3a37b00
blob
$ git cat-file -p 3bda87e5cf72eada744b504213d49357b3a37b00
mangoes are great
```

To create a tree, we can use the `git write-tree`. This command creates a tree based on the currently staged files.

```text
$ git write-tree
a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
$ find .git/objects -type f
.git/objects/3b/da87e5cf72eada744b504213d49357b3a37b00
.git/objects/01/bf8f94800cafb22f589104b3c6a9743c84b053
.git/objects/a6/dfdfda8182ac27a4f7ec9a3ef7fea562008686
```

As you can see, there are now three git objects - the newest one being the tree object itself (`hash`). Taking a look inside the newly created tree object, we can see the two blobs inside it

```
$ git cat-file -p a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
100644 blob 3bda87e5cf72eada744b504213d49357b3a37b00	file1.txt
100644 blob 01bf8f94800cafb22f589104b3c6a9743c84b053	file2.txt
```

100644 is borrowed from the UNIX file system and represents a normal file mode. Obviously the two items inside the tree are blobs (2nd column) with their object ids being displayed in the 3rd column. Lastly the file names are stored in 4th column.

This brings us to the commit object.

### Commits

Blobs store individual files. Trees help store the entire working directory together, so what do commits store then?

A **git commit** is a snapshot of a repository at some point in time, along with extra metadata.

The best way to figure out what's inside a commit is to create one and inspect it! We can create a commit based on a tree by using the `commit-tree` command. We'll also pipe in the commit message for the commit via stdin.

```text
$ echo 'Wrote about my love of mangoes' | git commit-tree a6dfdfd
e230e577b1c73e2d94ddafbffbe77fc1283d7793                <-- commit id
```

Let's see what's inside the object database. Notice that we can use the shortened version of the hash (`a6dfdfd`) for convenience here.

```text
$ find .git/objects -type f
.git/objects/3b/da87e5cf72eada744b504213d49357b3a37b00   <-- blob (YOUR_FILE_NAME)
.git/objects/01/bf8f94800cafb22f589104b3c6a9743c84b053   <-- blob (file2.txt)
.git/objects/a6/dfdfda8182ac27a4f7ec9a3ef7fea562008686   <-- tree object
.git/objects/e2/30e577b1c73e2d94ddafbffbe77fc1283d7793   <-- commit object
```

Now that the commit has been committed (you can check by using `git log`), lets take a look at the new file created. 

```text
$ git cat-file -p e230e5
tree a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
author Sanjay Narayana <snjay@users.noreply.github.com> 1614783692 +1100
committer Sanjay Narayana <snjay@users.noreply.github.com> 1614783692 +1100

Wrote about my love of mangoes
```

This is the contents of what is inside a commit file that is used by git. If we look at the individual lines, we'll notice some familiar friends.

`tree fc14c91` is simply a pointer the tree object we saw earlier which represents the state of the working directory at that time. It holds the whole repository's contents at the point of time the commit was made (this is why it's called a _snapshot_).

The `author` refers to the individual which edited the files for this commit, whilst the `committer` is the person who actually created the commit. The reason a distinction is made between an author and a committer is because these can technically be two separate individuals. The distinction is only made when git history is edited or re-written with a command such as [git format-patch](https://mirrors.edge.kernel.org/pub/software/scm/git/docs/git-format-patch.html) or [git commit --amend](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---amend). If history is edited, then both the author of the commit _and_ the committer can be credited for their work.

`Wrote about my love of mangoes` is our commit message written at the time the commit was created. This will be different if your commit message was different.

One other line not visible here is the 'parent' line. When there is more than 1 commit on a branch, the line will refer to the parent commit that the child commit belongs to. Every subsequent commit made uses the previous commit as a parent commit, allowing it to be linked to the list of commits made previously. Following this chain of commits back will get you back to the first commit. The 'parent' is not shown in this output because this is the first commit made to a repository.

## Commit ids

Everytime we used a command in the previous section, git seemed to be spitting out some random letters and numbers to represent the different git objects. 

**What exactly is a commit id string, and how is it generated?**

The commit id is a 40 character long string uniquely identifying a commit made to the repository. The short answer is that the commit id is a SHA-1 hash of the commit's metadata.

**[SHA-1](https://en.wikipedia.org/wiki/SHA-1)** is a hashing algorithm which works by taking in an some input and spitting out a 160 bit (40 character) hash. It is **one-way function**, which means it is easy to go convert an input into a hash, but difficult to go backwards to find the original input based on the output hash. 

SHA-1 is part of a family of cryptographic hashing functions which are generally only found in cryptography or security scenarios. However SHA-1 wasn't initially chosen for it's cryptographic properties but only because it was just [considered a good hash](https://www.youtube.com/watch?v=4XpnKHJAok8&t=56m16s) for verifying data integrity. Since the 2017 SHAttered attack ([https://shattered.io/](https://shattered.io/)) which found a way to practically generate SHA-1 collisions, future versions of Git (v2.13.0 and up) moved to using a [stronger version of the SHA-1 implementation](https://git-scm.com/docs/hash-function-transition/) by default to deal with the collision attack.

Let's try to generate our own commit id to understand how git does it internally.

### How commit ids are created

More formally, a git commit id is the SHA-1 hash of (1) a header, (2) a null terminator and (3) a data payload.

```text
commit_id = sha1(header + "\0" + data)
```

- `header` consists of the word "commit" and the size of the 'data' in bytes.
- `data` contains:
    1. author - the person who edited the files
    2. committer – the person who made the commit
    3. creation time
    4. a commit message - a message on the purpose of the commit
    5. parent commit sha1
    6. tree SHA-1 hash

For simplicity, let's try re-create the latest commit id in our dummy repository which we made previously, that is: `14f1e1b20b9934f79cd6e06a61a6e5e31a09f683`

> _Note: The commit id I'll have created will be **different** to the commit id you generate because the author, committer and the creation time will all be different._

### Replicating the latest commit id

In order to replicate the latest commit made to the repo, we need to form the `header` and the `data`. Let's save these into two separate shell variables so we understand what they are individually.

```shell
$ header=$(printf "commit %s" $(git cat-file commit HEAD | wc -c))
$ echo $header
commit 201
```

```shell
$ data=$(git cat-file commit HEAD)
$ echo $data
tree a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
author Sanjay Narayana <snjay@users.noreply.github.com> 1614778658 +1100
committer Sanjay Narayana <snjay@users.noreply.github.com> 1614778658 +1100

blah
```

Let's combine them, along with the null terminating character to see what the input to the sha1 function will look like. You won't be able to see the "\0" in the shell output.

```
$ echo "$header\0$data"
commit 201tree a6dfdfda8182ac27a4f7ec9a3ef7fea562008686
author Sanjay Narayana <snjay@users.noreply.github.com> 1614778658 +1100
committer Sanjay Narayana <snjay@users.noreply.github.com> 1614778658 +1100

blah
```

Finally, piping this output into `sha1sum` (use `shasum` if you are using MacOS) will result in the commit id of our latest commit. Ta da!

```text
$ echo $header"\0"$data | sha1sum
14f1e1b20b9934f79cd6e06a61a6e5e31a09f683  -
```

This is essentially what git does internally to generate a commit id hash. Obviously whilst the metadata available will be different when you create the commit (e.g. the creation time, author, size of content in bytes), this is the process that git uses to generate this commid id.

If you're interested in where exactly the hash is calculated in the source code, you can take a look at the `write_object_file_prepare` function in the git source code, [here](https://github.com/git/git/blob/master/object-file.c#L1729-L1733).

## Why are git objects stored in two character sub-directories?

One oddity you may have noticed is that files in the object database were arranged by the first two characters of the hash as a directory and the rest of the hash is the file.

```text
14f1e1b20b9934f79cd6e06a61a6e5e31a09f683                  <-- commit id
.git/objects/14/f1e1b20b9934f79cd6e06a61a6e5e31a09f683    <-- git object file
```

```text
.git/
└── objects/
    ├── 01/
    │   └── bf8f94800cafb22f589104b3c6a9743c84b053
    ├── 14/
    │   └── f1e1b20b9934f79cd6e06a61a6e5e31a09f683
    ├── 3b/
    │   └── da87e5cf72eada744b504213d49357b3a37b00
    ├── a6/
    │   └── dfdfda8182ac27a4f7ec9a3ef7fea562008686
    └── e2/
        └── 30e577b1c73e2d94ddafbffbe77fc1283d7793
```

The answer to this is quite simply for efficiency reasons. Git relies on the object database `.git/objects` directory to store and retrieve git objects. Accessing these files efficiently is key to keeping git fast. This is only true for simple loose objects. If and when things get a little hectic, git uses something called [pack-files](https://git-scm.com/book/en/v2/Git-Internals-Packfiles) to store and access these files more efficiently, I won't cover these here.

**How many sub-directories are possible?**

The total number of directories within the `.git/objects` directory are $$16^2 = 256$$ directories (two characters, each with a choice of 16 hexadecimal letters).

When git wants to find a loose object based on an id such as `14f1e1b20b9934f79cd6e06a61a6e5e31a09f683`, all it has to do is look at the first two characters to find the sub-directory `14/` and then search for the rest of the id within the smaller directory `f1e1b20b9934f79cd6e06a61a6e5e31a09f683`.

Think about the situation that git _doesn't_ store files inside these two-character directories and instead places all the files into the root `.git/objects` directory. In this situation, everytime git wants to find an object with it's id, it would need to perform a linear scan of the entire directory everytime to find a specific git object.

The cool thing about SHA-1 is that it distributes it's hashes well (even across the first two letters) which means it can splay the individual git object files well across the sub-directories without putting too many of the files into a small subset of two-character bucket.

Another reason is also because some older file systems (such as [ext-2](https://en.wikipedia.org/wiki/Ext2#File-system_limits) and [ext-3](https://en.wikipedia.org/wiki/Ext3#Disadvantages)) disallow more than ~32k subdirectories within a directory which happens _quite_ quickly for a non-trivial git repository.

## Conclusion

To sum it all up, git stores commits as zlib-encrypted text files inside the `.git/objects` folder. The name of these object files is the SHA-1 hash of a combination of items including a pointer to the source tree, the author, committer and a commit message. Also a small header is pre-pended to the hash function containing the word 'commit' and the size of the data in bytes.

We also replicated our own SHA-1 of the latest commit object to better understand how git is doing it under the hood. And finally, we explored the structure of the directory and why git uses two-character length sub-directories - for efficiency

_Thanks for reading, I hope you found this post insightful!_

## Resources

Here is a collection of the resources if you'd like to learn more about git commits.

- Replicate SHA-1 commit id: https://gist.github.com/masak/2415865


[^1]: There is one more object type called a 'tags.' However this post won't cover them.