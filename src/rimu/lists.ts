import * as utils from './utils'
import * as io from './io'
import * as delimitedBlocks from './delimitedblocks'
import * as lineBlocks from './lineblocks'

interface Definition {
  match: RegExp
  listOpenTag: string
  listCloseTag: string
  itemOpenTag: string
  itemCloseTag: string
  termOpenTag?: string    // Definition lists only.
  termCloseTag?: string   // Definition lists only.
}

// Information about a matched list item element.
interface ItemState {
  match: RegExpExecArray
  def: Definition
  id: string  // List ID.
}

let defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Unordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
    listOpenTag: '<ul>',
    listCloseTag: '</ul>',
    itemOpenTag: '<li>',
    itemCloseTag: '</li>'
  },
  // Ordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
    listOpenTag: '<ol>',
    listCloseTag: '</ol>',
    itemOpenTag: '<li>',
    itemCloseTag: '</li>'
  },
  // Definition lists.
  // $1 is term, $2 is list ID, $3 is definition.
  {
    match: /^\\?\s*(.*[^:])(:{2,4})(|\s+.*)$/,
    listOpenTag: '<dl>',
    listCloseTag: '</dl>',
    itemOpenTag: '<dd>',
    itemCloseTag: '</dd>',
    termOpenTag: '<dt>',
    termCloseTag: '</dt>'
  },
]

let ids: string[]   // Stack of open list IDs.

export function render(reader: io.Reader, writer: io.Writer): boolean {
  if (reader.eof()) throw 'premature eof'
  let startItem: ItemState
  if (!(startItem = matchItem(reader))) {
    return false
  }
  ids = []
  renderList(startItem, reader, writer)
  // ids should now be empty.
  return true
}

function renderList(startItem: ItemState, reader: io.Reader, writer: io.Writer): ItemState {
  ids.push(startItem.id)
  writer.write(utils.injectHtmlAttributes(startItem.def.listOpenTag, lineBlocks.blockAttributes))
  let nextItem: ItemState
  while (true) {
    nextItem = renderListItem(startItem, reader, writer)
    if (!nextItem || nextItem.id !== startItem.id) {
      // End of list or next item belongs to ancestor.
      writer.write(startItem.def.listCloseTag)
      ids.pop()
      return nextItem
    }
    startItem = nextItem
  }
}

function renderListItem(startItem: ItemState, reader: io.Reader, writer: io.Writer): ItemState {
  let def = startItem.def
  let match = startItem.match
  let text: string
  if (match.length === 4) { // 3 match groups => definition list.
    writer.write(def.termOpenTag)
    text = utils.replaceInline(match[1], {macros: true, spans: true})
    writer.write(text)
    writer.write(def.termCloseTag)
  }
  writer.write(def.itemOpenTag)
  // Process of item text.
  let lines = new io.Writer()
  lines.write(match[match.length - 1])  // Item text from first line.
  lines.write('\n')
  reader.next()
  let nextItem: ItemState
  nextItem = readToNext(reader, lines)
  text = lines.toString()
  text = utils.replaceInline(text, {macros: true, spans: true})
  writer.write(text)
  while (true) {
    if (!nextItem) {
      // EOF or non-list related item.
      writer.write(def.itemCloseTag)
      return null
    }
    else if (nextItem.id) {
      // List item.
      if (ids.indexOf(nextItem.id) !== -1) {
        // Item belongs to current list or an ancestor list.
        writer.write(def.itemCloseTag)
        return nextItem
      }
      else {
        // Render new child list.
        nextItem = renderList(nextItem, reader, writer)
        writer.write(def.itemCloseTag)
        return nextItem
      }
    }
    else {
      // Delimited block.
      let savedIds = ids
      ids = []
      delimitedBlocks.render(reader, writer)
      ids = savedIds
      reader.skipBlankLines()
      if (reader.eof()) {
        writer.write(def.itemCloseTag)
        return null
      }
      else {
        nextItem = matchItem(reader)
      }
    }
  }
  // Should never arrive here.
}

// Write the list item text from the reader to the writer. Return
// 'next' containing the next element's match and identity or null if
// there are no more list releated elements.
function readToNext(reader: io.Reader, writer: io.Writer): ItemState {
  // The reader should be at the line following the first line of the list
  // item (or EOF).
  let next: ItemState
  while (true) {
    if (reader.eof()) return null
    if (reader.cursor() === '') {
      // Encountered blank line.
      reader.next()
      if (reader.cursor() === '') {
        // A second blank line terminates the list.
        return null
      }
      if (reader.eof()) return null
      // A single blank line separates list item from ensuing text.
      return matchItem(reader, ['indented'])
    }
    next = matchItem(reader, ['comment', 'code', 'division', 'html', 'quote', 'quote-paragraph'])
    if (next) {
      // Encountered list item or attached Delimited Block.
      return next
    }
    // Current line is list item text so write it to the output and move to the next input line.
    writer.write(reader.cursor())
    writer.write('\n')
    reader.next()
  }
}

// Check if the line at the reader cursor matches a list related element.
// 'attachments' specifies the names of allowed Delimited Block elements (in addition to list items).
// If it matches a list item return ItemState.
// If it matches an attahced Delimiter Block return {}.
// If it does not match a list related element return null.
function matchItem(reader: io.Reader, attachments: string[] = []): ItemState {
  // Check if the line matches a List definition.
  let line = reader.cursor()
  let item = {} as ItemState    // ItemState factory.
  // Check if the line matches a list item.
  for (let def of defs) {
    let match = def.match.exec(line)
    if (match) {
      if (match[0][0] === '\\') {
        reader.cursor(reader.cursor().slice(1))   // Drop backslash.
        return null
      }
      item.match = match
      item.def = def
      item.id = match[match.length - 2] // The second to last match group is the list ID.
      return item
    }
  }
  // Check if the line matches an allowed attached Delimited block.
  let def: delimitedBlocks.Definition
  for (let name of attachments) {
    def = delimitedBlocks.getDefinition(name)
    if (def.openMatch.test(line)) {
      return item
    }
  }
  return null
}

