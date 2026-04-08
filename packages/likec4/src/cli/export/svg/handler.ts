import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { path, project, useDotBin } from '../../options'
import { showSupportUsMessage } from '../../support-message'
import { loadFonts } from './fonts'
import { renderViewToSvg } from './render-svg'

type SvgExportArgs = {
  path: string
  output: string | undefined
  project: string | undefined
  useDot: boolean
  theme: 'light' | 'dark'
  outputType: 'relative' | 'flat'
  filter: string[] | undefined
}

async function runExportSvg(args: SvgExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)

  await using likec4 = await fromWorkspace(args.path, {
    graphviz: args.useDot ? 'binary' : 'wasm',
    watch: false,
  })

  const projects = [...likec4.projectsManager.all]
  if (args.project) {
    if (!projects.some(p => p === args.project)) {
      logger.error(`project not found: ${args.project}`)
      throw new Error(`project not found: ${args.project}`)
    }
  }
  if (!hasAtLeast(projects, 1)) {
    logger.error('No projects found')
    throw new Error('No projects found')
  }

  const fonts = await loadFonts()
  logger.info(k.dim('fonts loaded'))

  for (const prj of projects) {
    if (args.project && prj !== args.project) continue

    let views = await likec4.diagrams(prj)

    if (args.filter && hasAtLeast(args.filter, 1) && hasAtLeast(views, 1)) {
      const { default: picomatch } = await import('picomatch')
      const matcher = picomatch(args.filter)
      views = views.filter(v => matcher(v.id))
    }

    if (!hasAtLeast(views, 1)) {
      logger.warn('no views found')
      continue
    }

    const output = args.output ?? resolve(args.path, 'export', 'svg')

    for (const view of views) {
      let relativePath = '.'
      if (args.outputType === 'relative' && view.sourcePath) {
        const rp = view.sourcePath
        relativePath = rp.includes('/') ? rp.slice(0, rp.lastIndexOf('/')) : '.'
      }

      const outPath = resolve(output, relativePath, `${view.id}.svg`)
      await mkdir(dirname(outPath), { recursive: true })

      const svg = await renderViewToSvg(view, { fonts })
      await writeFile(outPath, svg)

      const displayPath = outPath.startsWith(args.path) ? relative(args.path, outPath) : outPath
      logger.info(`${k.dim('exported')} ${displayPath}`)
    }
  }

  timer.stopAndLog(`✓ export in `)
}

async function svgHandler(args: SvgExportArgs): Promise<void> {
  const logger = createLikeC4Logger('c4:export')
  await runExportSvg(args, logger)
}

export function svgCmd(yargs: Argv) {
  return yargs.command({
    command: 'svg [path]',
    describe: 'export views to SVG',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          'outdir': {
            alias: ['o', 'output'],
            type: 'string',
            desc: 'output directory for SVG files',
            normalize: true,
            nargs: 1,
            coerce: resolve,
          },
          project,
          'use-dot': useDotBin,
          'theme': {
            choices: ['light', 'dark'] as const,
            desc: 'color-scheme to use, defaults to light',
            nargs: 1,
          },
          'flat': {
            alias: ['flatten'],
            type: 'boolean',
            desc: 'flatten all SVGs in outdir ignoring sources structure',
          },
          'filter': {
            alias: 'f',
            array: true,
            string: true,
            desc: 'include views with ids matching given patterns',
          },
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export svg')}
    ${k.gray('Export views to SVG in current directory')}

  ${k.green('$0 export svg -o ./out src/likec4')}
    ${k.gray('Export element views from src/likec4 to ./out directory')}
`),
    handler: async args => {
      await svgHandler({
        path: args.path,
        output: args.outdir,
        project: args.project,
        useDot: !!args['use-dot'],
        theme: (args.theme as 'light' | 'dark') ?? 'light',
        outputType: args.flat ? 'flat' : 'relative',
        filter: args.filter,
      })
      showSupportUsMessage()
    },
  })
}
