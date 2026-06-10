// カテゴリ一覧ページから商品詳細URL（/item/<code>.html）を収集して urls.txt に保存する
// 使い方: node scripts/collect-urls.mjs [--out urls.txt] <一覧ページURL1> <一覧ページURL2> ...
//   例: node scripts/collect-urls.mjs https://shiro-shiro.jp/category/111/
// DB登録済みの商品は buy_links（shop_name=公式サイト）の official_url と商品コードで突き合わせて除外する。
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const MAX_PAGES = 30;

function parseArgs(argv) {
  const args = { out: 'urls.txt', urls: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = argv[++i];
    else args.urls.push(argv[i]);
  }
  return args;
}

// URLから商品コードを抽出（/item/12702.html と /ec/pro/disp/1/12702 の両形式に対応）
function extractCode(url) {
  const m = String(url ?? '').match(/\/item\/(\d+)\.html|\/pro\/disp\/\d+\/(\d+)/);
  return m ? (m[1] ?? m[2]) : null;
}

const args = parseArgs(process.argv.slice(2));
if (args.urls.length === 0) {
  console.error('使い方: node scripts/collect-urls.mjs [--out urls.txt] <一覧ページURL...>');
  process.exit(1);
}
for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) {
    console.error(`.env に ${key} がありません`);
    process.exit(1);
  }
}

// 1) DB登録済みの商品コードを取得
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: links, error } = await supabase.from('buy_links').select('url').eq('shop_name', '公式サイト');
if (error) {
  console.error(`buy_links の取得に失敗: ${error.message}`);
  process.exit(1);
}
const registeredCodes = new Set(links.map((l) => extractCode(l.url)).filter(Boolean));
console.log(`DB登録済みの公式URL: ${links.length}件（商品コード解決 ${registeredCodes.size}件）`);

// 2) 一覧ページを巡回して商品コードを収集
const browser = await chromium.launch();
const page = await browser.newPage({ locale: 'ja-JP' });
const foundCodes = new Set();

async function collectFrom(url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => a.href)
  );
  let added = 0;
  for (const href of hrefs) {
    const code = extractCode(href);
    if (code && !foundCodes.has(code)) {
      foundCodes.add(code);
      added++;
    }
  }
  // DOM上のページネーションリンク（srDispProductSearchList ...&page=N）も回収
  // #fragment 違いの同一ページを重複巡回しないよう、フラグメントは除去する
  const pagers = [
    ...new Set(
      hrefs
        .filter((h) => /srDispProductSearchList[^"']*[?&]page=\d+/.test(h))
        .map((h) => h.split('#')[0])
    ),
  ];
  return { added, pagers };
}

try {
  for (const listUrl of args.urls) {
    console.log(`\n一覧ページ: ${listUrl}`);
    const visited = new Set();
    const queue = [listUrl];
    let pageNo = 0;
    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);
      if (pageNo > 0) await new Promise((r) => setTimeout(r, 1000)); // 負荷配慮
      pageNo++;
      const { added, pagers } = await collectFrom(url);
      console.log(`  ${pageNo}ページ目: +${added}件 (${url.replace(/^https:\/\/shiro-shiro\.jp/, '')})`);
      for (const p of pagers) {
        if (!visited.has(p)) queue.push(p);
      }
    }
  }
} finally {
  await browser.close();
}

// 3) 登録済みを除外して /item/<code>.html 形式で保存
const newCodes = [...foundCodes].filter((c) => !registeredCodes.has(c));
const urls = newCodes.map((c) => `https://shiro-shiro.jp/item/${c}.html`);
await writeFile(args.out, urls.join('\n') + (urls.length ? '\n' : ''), 'utf8');

console.log(`\n収集した商品コード: ${foundCodes.size}件`);
console.log(`うちDB登録済みで除外: ${foundCodes.size - newCodes.length}件`);
console.log(`未登録として ${args.out} に保存: ${newCodes.length}件`);
