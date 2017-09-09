/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */

import * as Api from './api'
import * as Options from './options'

export {RenderOptions as Options, CallbackMessage, CallbackFunction} from './options'

/*
  The single public API which translates Rimu Markup to HTML:

    render(source [, options])
 */
export function render(source: string, opts: Options.RenderOptions = {}): string {
  Options.updateOptions(opts)
  return Api.render(source)
}

// Load-time initialization.
Api.init()
