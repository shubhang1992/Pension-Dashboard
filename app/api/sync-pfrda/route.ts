import { NextResponse } from 'next/server'
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300

type M1Result = { rowsImported: number; latestAsOf?: string; error?: string }

/**
 * POST /api/sync-pfrda
 * Fetches all PFRDA data from official URLs (M1, A22, A6, M7) and upserts into DB.
 * Uses dynamic URL discovery to always fetch the latest files.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [m1Mod, urlMod, stateMod] = await Promise.all([
      // @ts-expect-error - no declaration file for .mjs
      import('../../../lib/pfrda-m1-sync.mjs'),
      // @ts-expect-error - no declaration file for .mjs
      import('../../../lib/pfrda-urls.mjs'),
      // @ts-expect-error - no declaration file for .mjs
      import('../../../scripts/import-state-wise-pfrda.mjs'),
    ]) as [
      { syncM1FromPfrda: (p: PrismaClient, opts?: Record<string, unknown>) => Promise<M1Result> },
      {
        getLatestPfrdaUrls: () => Promise<{ M1: string; A22: string; A6: string; M7: string }>
        fetchPfrdaExcel: (url: string) => Promise<Buffer>
      },
      {
        runStateWiseImport: (
          p: PrismaClient,
          o: { a22: Buffer; a6: Buffer; m7: Buffer }
        ) => Promise<{ upserted: number; m7LatestMonth: string | null }>
      },
    ]

    const sources = await urlMod.getLatestPfrdaUrls()

    const m1Result = await m1Mod.syncM1FromPfrda(prisma, { url: sources.M1 })
    if (m1Result.error) {
      return NextResponse.json(
        { ok: false, error: m1Result.error, m1Rows: 0, stateUpserted: 0, sources },
        { status: 502 }
      )
    }

    const [a22Buf, a6Buf, m7Buf] = await Promise.all([
      urlMod.fetchPfrdaExcel(sources.A22),
      urlMod.fetchPfrdaExcel(sources.A6),
      urlMod.fetchPfrdaExcel(sources.M7),
    ])
    const stateResult = await stateMod.runStateWiseImport(prisma, {
      a22: a22Buf,
      a6: a6Buf,
      m7: m7Buf,
    })

    return NextResponse.json({
      ok: true,
      m1Rows: m1Result.rowsImported,
      m1LatestAsOf: m1Result.latestAsOf,
      stateUpserted: stateResult.upserted,
      m7LatestMonth: stateResult.m7LatestMonth,
      sources,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, error: message, m1Rows: 0, stateUpserted: 0 },
      { status: 500 }
    )
  }
}
