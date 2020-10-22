# BC3430-Final-Project
Final project for Computational Sound BC3430 Fall 2020

Authored by Oscar Garcia (ojg2111) and Tim Vallancourt (tpv2106)

Generally building upon our Lab 5 implementations of pitch set theory to continue upon the idea of randomly/automatically generated music. 

### Build instructions

1. `npm install` to pull dependencies from npm
2. `npx webpack` to build main.js in /dist
3. Open `/dist/index.html` in Chrome

### Notes

* Building the bundle for the first time might take some time (~30s).
* Audio generation can take up to 30s to fire off in weird situations. This tends to happen when using everything 
(e.g. sampled instruments, effects, and generative ADSR), but can occasionally happen otherwise too. A refresh will
generally solve the issue if persistent. 
* See logs for general notes on what is happening. ADSR not logged.
* If you see errors, double check to see whether the initial pitch class set is out of bounds or not; typically due to
pitch classes >6 when set to a tonal group.

### "Blog Post"


