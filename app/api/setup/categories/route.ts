import { NextRequest, NextResponse } from 'next/server';
import { seedCategories } from '@/lib/sheets';
import { config } from '@/lib/config';

/**
 * One-time migration: visit once after deploying the Expense/Investment/Transfer Type
 * column: https://<your-app-url>/api/setup/categories?secret=<SETUP_SECRET>
 *
 * Unlike /api/setup (safe to call repeatedly, only fills in missing tabs), this
 * OVERWRITES the entire Categories tab with the new Category/Aliases/Type table.
 * Any manual edits made directly in the Categories tab before running this will be
 * lost — only run it once, deliberately, when migrating to the new schema.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expected = config.setupSecret();

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Missing or incorrect secret.' }, { status: 401 });
  }

  await seedCategories();
  return NextResponse.json({
    ok: true,
    message: 'Categories tab overwritten with the Expense/Investment/Transfer schema.',
  });
}
