# Rimu

Rimu is a readable text to HTML markup language inspired by AsciiDoc
and Markdown.


## Implementation

- Single lightweight JavaScript file (less than 14KB minified) that
  can be dropped onto a Web page or used as a Node module.
- No dependencies.
- Simple one-function API.
- Raw HTML can be mixed in (a la Markdown).
- HTML attributes can be applied to Rimu block elements.
- Written in TypeScript.
- Available from Github and as an npm module.
- Includes command-line compiler and playground GUI.
- MIT license.


## Rimu Playground

Read the documentation and experiment with Rimu in the _Rimu
Playground_.

Play with it here <http://rimumarkup.org/rimu/rimuplayground.html> or
open the `rimuplayground.html` locally in in your browser.


## Installing Rimu

- Install Rimu as a Node.js module (includes the `rimuc` command-line
  tool, run `rimuc --help`)):

  npm install rimu

- Get the source from Github: <https://github.com/srackham/rimu>


## Using Rimu

- See the _API_ documentation topic in the _Rimu Playground_.
- Take a look at `./bin/rimuc.js` and `./bin/rimuplayground.html` for
  examples of using Rimu with Node.js and in the browser respectively.


## Browser compatibility

There hasn't been a huge amount of browser testing. Works with the
latest versions of IE, Firefox and Chrome, seems OK on Android 4 and
iOS.  Does not work on IE8.
