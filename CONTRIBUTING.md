L20n uses Bugzilla to track bugs and feature requests.  All code 
discussion lives in Bugzilla comments.  It helps us keep everything in 
a single place.  That's why we prefer patches attached to bugs over 
pull requests in Github.

This guide explains how to submit a patch.

You can [browse the open bugs][] on Bugzilla or [file a new one][].

[browse the open bugs]: https://bugzilla.mozilla.org/describecomponents.cgi?product=L20n
[file a new one]: https://bugzilla.mozilla.org/enter_bug.cgi?product=L20n


Abstract
--------

- Work in feature branches.
- Track `upstream/master` in `master`.
- Rebase local branches ontop of master to work with the up-to-date 
  codebase.
- Discuss code in Bugzilla by attaching patches to bugs.
- Keep history clean with `git rebase -i`.
- Amend commit message to mention the bug number and the reviewer.
- Push the branch to your fork and let us pull from it and merge it 
  into `master`.


Getting Started
---------------

To get started, fork the l20n.js repository, and with your own fork,

```bash
git clone git://git@github.com/YOU/l20n.js.git
cd l20n.js
git remote add upstream git@github.com:l20n/l20n.js.git
git submodule update --init --recursive
```

If you're new to git, check out the [git cheatsheat][].

[git cheatsheat]: http://cheat.errtheblog.com/s/git/


Start a new feature branch
--------------------------

Let's assume you're working on bug 800000 that is about adding 
installation docs to the codebase.

```bash
git checkout -b 800000-install-docs
# ...work...
git add INSTALL
git commit -m "Add the INSTALL file"
# ...work...
git add INSTALL
git commit -m "Add the pip/virtualenv step"
git diff master... > patch.diff
# ...attach the patch on bugzilla and get review...

# ...address reviewer's comments...
git add INSTALL
git commit -m "Specify Python version, as per Joe's review"
git diff master... > patch.diff
# ...rinse and repeat...
```

`git diff master...` is a shorthand diff command that lets you see what 
a merge to the `master` branch would introduce given the current HEAD.  
[GitHub's help] has a good explanation of this syntax.

[GitHub's help]: http://learn.github.com/p/diff.html#what_a_merge_would_introduce

> **Note:** If your changes include file renaming, generate the diff by 
> running `git diff -M master...` (which stands for `git diff 
> --find-renames master...`).  You can specify a similarity threshold 
> if the default doesn't give you satisfying results, e.g. `git diff 
> -M70% master...`.  Find out more about this option in [git 
> documentation][].

[git documentation]: http://www.kernel.org/pub/software/scm/git/docs/git-diff.html


Keeping up with the upstream
----------------------------

As long as you work locally in your branch, you're encouraged to use 
`git rebase` to stay on the most recent codebase.  Don't merge `master` 
into your branch, unless it has been previously published and you know 
people have pulled from it.

```bash
git checkout master
git pull upstream master
git checkout 800000-install-docs
git rebase master
```

A good rule of thumb is:

- if the branch is local or private, use `git rebase`,
- if the branch has been published, use `git merge`.

Linus Torvalds [explains it best][].

[explains it best]: http://lwn.net/Articles/328438/


Push your feature branch after an r+
------------------------------------

Once you get r+, you will want to:

- rebase to avoid bitrot (use `-i` and squash/fixup unneeded commits),
- adjust the commit message,
- push to your origin,
- let us know about it.

### Rebase

```bash
# make sure you're on the feature branch
git checkout 8000000-install-docs
# rebase and clean the log
git rebase -i master
```

Your editor will open.  Leave the first commit as `pick` and `squash` 
all others.  (In rare and justified cases, you might want to leave more 
than one commit.)

```git
pick dd9511f Add the INSTALL file
squash bb0fc6e Add the pip/virtualenv step
squash c9781ef Fix a typo
squash 64a4f42 Add the third installation step, as per Bob's suggestion
squash 84d7d82 Specify Python version, as per Joe's review
squash b377ca6 Add the env creation step
```

### Adjust the commit message

If you have at least one `reword` or `squash` when rebasing, your 
editor will open again.  Adjust the commit message.  The final commit 
message should include:

- the bug number,
- short summary of the changes made on the feature branch,
- reviews (e.g. r=joe),
- (optional) longer description separated by a blank line.

Example:

> Bug 800000 - Add installation instructions, r=joe
>
> The installation instructions are in the INSTALL file.

The final history of your branch should look something like this:

```git
dd9511f Add the INSTALL file
64a4f42 Bug 800000 - Add installation instructions, r=joe
```

> **Note:** If the commit message after the rebase still requires 
> changes, you can fix it like so:
> 
>     # ...change the commit message if needed...
>     git commit --amend

### Push

You are now ready to push your branch.

```bash
# make sure you're on the feature branch
git checkout 8000000-install-docs
# push the branch to the origin
git push origin 800000-install-docs
```

### Comment in the bug

Comment in the bug with the URL of your branch so that we can pull and 
merge from it.
