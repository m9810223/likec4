import { pipe } from 'remeda'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { drawioCmd } from './drawio/handler'
import { jsonCmd } from './json/handler'
import { pngCmd } from './png/handler'
import { svgCmd } from './svg/handler'

/**
 * Registers the `export` command with subcommands png, json, drawio, svg.
 * @param yargs - yargs instance to extend
 * @returns yargs chain with export <format> [path] and format-specific options
 */
const exportCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'export <format> [path]',
      describe: 'Export to images, SVG, JSON, or DrawIO',
      builder: yargs =>
        pipe(
          yargs.usage(`${k.bold('Usage:')} $0 export <format> [path]`),
          pngCmd,
          jsonCmd,
          drawioCmd,
          svgCmd,
        )
          .updateStrings({
            'Commands:': k.bold('Formats:'),
          }),
      handler: () => void 0,
    })
}

export default exportCmd
