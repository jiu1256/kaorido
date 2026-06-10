// 商品データ入力の自動化スクリプト（Kaorido）
// 使い方: node scripts/import-product.mjs --brand SHIRO [--save] [--headful] <URL1> <URL2> ...
//   --save    DB保存を実行（無ければ抽出結果の整形表示のみ = dry-run）
//   --headful ブラウザを可視状態で起動（KARTE等のbot検知対策の検証用）
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_TEMPLATE_PATH = path.join(__dirname, '..', 'prompts', 'extract-product.md');
const MODEL = 'claude-haiku-4-5';
const MAX_PAGE_TEXT_CHARS = 60000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

// ---- 表示ユーティリティ（ANSIカラー） ----
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};
const warn = (msg) => console.log(`${c.yellow}⚠ ${msg}${c.reset}`);
const err = (msg) => console.error(`${c.red}✖ ${msg}${c.reset}`);
const info = (msg) => console.log(`${c.cyan}${msg}${c.reset}`);

// ---- 引数パース ----
function parseArgs(argv) {
  const args = { brand: null, save: false, headful: false, urls: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--brand') {
      args.brand = argv[++i];
    } else if (a === '--save') {
      args.save = true;
    } else if (a === '--headful') {
      args.headful = true;
    } else if (a.startsWith('--')) {
      err(`不明なオプション: ${a}`);
      process.exit(1);
    } else {
      args.urls.push(a);
    }
  }
  return args;
}

// ---- 環境変数チェック ----
function loadEnv() {
  const missing = [];
  for (const key of ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[key]) {
      missing.push(key);
      if (process.env[`VITE_${key}`]) {
        warn(`VITE_${key} は見つかりましたが、このスクリプトは ${key}（VITE_なし）を要求します。.env に追記してください。`);
      }
    }
  }
  if (missing.length > 0) {
    err(`.env に以下の環境変数がありません: ${missing.join(', ')}`);
    err('.env.example を参考に .env を作成してください。');
    process.exit(1);
  }
}

// ---- Supabaseからマスタ取得（idも保持して--save時の解決に使う） ----
async function fetchMasters(supabase) {
  const [tagsRes, effectsRes, typesRes] = await Promise.all([
    supabase.from('tags').select('id, name'),
    supabase.from('effects').select('id, name_ja'),
    supabase.from('products').select('type'),
  ]);
  for (const [label, res] of [['tags', tagsRes], ['effects', effectsRes], ['products.type', typesRes]]) {
    if (res.error) {
      err(`${label} の取得に失敗: ${res.error.message}`);
      process.exit(1);
    }
  }
  const tagIdByName = new Map(tagsRes.data.filter((r) => r.name).map((r) => [r.name, r.id]));
  const effectIdByName = new Map(effectsRes.data.filter((r) => r.name_ja).map((r) => [r.name_ja, r.id]));
  return {
    tags: [...tagIdByName.keys()],
    effects: [...effectIdByName.keys()],
    types: [...new Set(typesRes.data.map((r) => r.type).filter(Boolean))],
    tagIdByName,
    effectIdByName,
  };
}

// ---- ブランド照合 ----
async function resolveBrand(supabase, brandName) {
  const { data, error } = await supabase.from('brands').select('id, name').eq('name', brandName);
  if (error) {
    err(`brands の取得に失敗: ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    err(`ブランド「${brandName}」は brands テーブルに存在しません。`);
    err('新ブランドは管理画面で先に登録してください。');
    process.exit(1);
  }
  return data[0];
}

// ---- プロンプトテンプレートの読み込みと差し込み ----
async function buildSystemPrompt({ tags, effects, types }) {
  const template = await readFile(PROMPT_TEMPLATE_PATH, 'utf8');
  return template
    .replaceAll('{{既存type一覧}}', types.join('、'))
    .replaceAll('{{tags.name一覧}}', tags.join('、'))
    .replaceAll('{{effects.name_ja一覧}}', effects.join('、'));
}

// ---- ページ取得（Playwrightでレンダリング後のHTMLを取得） ----
// JS注入コンテンツ（タブ・遅延描画等）を拾うため、素のfetchではなくブラウザ経由で取る。
// ブラウザ起動に失敗した場合は素のfetchにフォールバック。
async function createPageFetcher(headful) {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: !headful });
  } catch (e) {
    warn(`ブラウザ起動に失敗したため素のfetchにフォールバックします: ${e.message.split('\n')[0]}`);
  }

  const fetchRendered = async (url) => {
    const context = await browser.newContext({ userAgent: UA, locale: 'ja-JP', viewport: { width: 1280, height: 900 } });
    try {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      // lazy-load対策に軽くスクロールして少し待つ
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 100));
        }
      });
      await page.waitForTimeout(2000);
      return await page.content();
    } finally {
      await context.close();
    }
  };

  const fetchPlain = async (url) => {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.text();
  };

  return {
    fetchHtml: browser ? fetchRendered : fetchPlain,
    close: async () => {
      if (browser) await browser.close();
    },
  };
}

function htmlToText(html, url) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer').remove();
  let text = $('body').text() || $.root().text();
  text = text.replace(/[ \t\r]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (text.length > MAX_PAGE_TEXT_CHARS) {
    warn(`ページテキストが ${text.length} 文字あるため ${MAX_PAGE_TEXT_CHARS} 文字に切り詰めました: ${url}`);
    text = text.slice(0, MAX_PAGE_TEXT_CHARS);
  }
  return text;
}

// ---- JSONパース（コードフェンス等の混入に耐える） ----
function parseModelJson(raw) {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('JSONオブジェクトが見つかりません');
  }
  return JSON.parse(s.slice(start, end + 1));
}

// ---- Claude呼び出し（パース失敗時は1回だけリトライ） ----
async function extractProduct(anthropic, systemPrompt, url, pageText) {
  const userContent = `URL: ${url}\n\n以下は商品ページのテキストです。\n\n${pageText}`;
  const call = async (extraEmphasis) => {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: extraEmphasis
            ? `${userContent}\n\n【重要】JSONのみを出力してください。前置き・説明・\`\`\` は一切禁止です。`
            : userContent,
        },
      ],
    });
    return res.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
  };

  let raw = await call(false);
  try {
    return parseModelJson(raw);
  } catch (e) {
    warn(`JSONパース失敗（${e.message}）。リトライします: ${url}`);
    raw = await call(true);
    return parseModelJson(raw);
  }
}

// ---- バリデーション ----
function validateProduct(data, masters) {
  const result = { errors: [], skippedTags: [], skippedEffects: [], truncatedTags: [] };

  if (!data.new_type && !masters.types.includes(data.type)) {
    result.errors.push(`type「${data.type}」は既存type一覧にありません（new_type=false）`);
  }
  if (!Array.isArray(data.variants) || data.variants.length === 0) {
    result.errors.push('variants が空です');
  }
  if (Array.isArray(data.tags)) {
    result.skippedTags = data.tags.filter((t) => !masters.tagIdByName.has(t));
    data.tags = data.tags.filter((t) => masters.tagIdByName.has(t));
    if (data.tags.length > 7) {
      result.truncatedTags = data.tags.slice(7);
      data.tags = data.tags.slice(0, 7);
    }
  }
  if (Array.isArray(data.effects)) {
    result.skippedEffects = data.effects.filter((e) => !masters.effectIdByName.has(e));
    data.effects = data.effects.filter((e) => masters.effectIdByName.has(e));
  }
  return result;
}

// ---- 商品名の正規化（upsert判定用） ----
// 前後空白除去・連続空白(全角含む)を1つに・全角英数記号を半角に
function normalizeName(s) {
  if (!s) return '';
  return s
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---- 代表variantの選択（最大容量。数値が読めないものは除外、全滅なら先頭） ----
function pickRepresentativeVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return {};
  let best = null;
  let bestVal = -Infinity;
  for (const v of variants) {
    const m = String(v.volume ?? '').match(/([\d.]+)\s*(?:ml|g)/i);
    if (m && parseFloat(m[1]) > bestVal) {
      bestVal = parseFloat(m[1]);
      best = v;
    }
  }
  return best ?? variants[0];
}

// ---- DB保存（docs/schema.md のマッピング参照） ----
// 保存順序: products → fragrance_notes → product_tags → product_effects → buy_links
// 同一 brand_id + name が既に存在する場合は更新（重複登録防止）
async function saveProduct(supabase, brand, data, masters) {
  const rep = pickRepresentativeVariant(data.variants);

  // 1) products upsert（名前は正規化して比較。類似名がある場合は保存せず人間に判断を委ねる）
  const allProducts = await supabase
    .from('products')
    .select('id, name')
    .eq('brand_id', brand.id);
  if (allProducts.error) throw new Error(`products 検索失敗: ${allProducts.error.message}`);

  const targetNorm = normalizeName(data.name);
  const exact = allProducts.data.find((p) => normalizeName(p.name) === targetNorm);
  if (!exact) {
    const similar = allProducts.data.filter((p) => {
      const n = normalizeName(p.name);
      return n.includes(targetNorm) || targetNorm.includes(n);
    });
    if (similar.length > 0) {
      throw new Error(
        `類似名の登録済み商品があるため保存を中止しました。重複なら名前を揃えて再実行、別商品なら手動登録してください。\n` +
          `    抽出した名前: ${data.name}\n` +
          similar.map((p) => `    候補: ${p.name} (id=${p.id})`).join('\n')
      );
    }
  }
  const existing = { data: exact ?? null };

  const payload = {
    brand_id: brand.id,
    name: data.name,
    type: data.type,
    price: rep.price ?? null,
    volume: rep.volume ?? null,
    desc_ja: data.desc_ja ?? null,
    desc_en: data.desc_en ?? null,
    desc_ko: data.desc_ko ?? null,
    desc_zh: data.desc_zh ?? null,
    ingredients: data.ingredients ?? null,
    ingr_en: data.ingr_en ?? null,
    ingr_ko: data.ingr_ko ?? null,
    ingr_zh: data.ingr_zh ?? null,
    variants: data.variants ?? [],
  };

  let productId;
  let action;
  if (existing.data) {
    productId = existing.data.id;
    action = '更新';
    const upd = await supabase
      .from('products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (upd.error) throw new Error(`products 更新失敗: ${upd.error.message}`);
  } else {
    action = '新規作成';
    const ins = await supabase
      .from('products')
      .insert({ ...payload, is_published: false })
      .select('id')
      .single();
    if (ins.error) throw new Error(`products 挿入失敗: ${ins.error.message}`);
    productId = ins.data.id;
  }

  // 2) fragrance_notes（既存を消して入れ直し。note_type別に display_order 0始まり連番）
  // DB/管理画面の note_type は top/mid/base（抽出JSONの middle は mid に変換）
  const NOTE_TYPE_MAP = { top: 'top', middle: 'mid', base: 'base' };
  const delNotes = await supabase.from('fragrance_notes').delete().eq('product_id', productId);
  if (delNotes.error) throw new Error(`fragrance_notes 削除失敗: ${delNotes.error.message}`);
  const noteRows = [];
  for (const jsonKey of ['top', 'middle', 'base']) {
    (data.notes?.[jsonKey] ?? []).forEach((ingredientName, i) => {
      noteRows.push({ product_id: productId, note_type: NOTE_TYPE_MAP[jsonKey], ingredient_name: ingredientName, display_order: i });
    });
  }
  if (noteRows.length > 0) {
    const insNotes = await supabase.from('fragrance_notes').insert(noteRows);
    if (insNotes.error) throw new Error(`fragrance_notes 挿入失敗: ${insNotes.error.message}`);
  }

  // 3) product_tags（既存を消して入れ直し）
  const delTags = await supabase.from('product_tags').delete().eq('product_id', productId);
  if (delTags.error) throw new Error(`product_tags 削除失敗: ${delTags.error.message}`);
  const tagRows = (data.tags ?? []).map((t) => ({ product_id: productId, tag_id: masters.tagIdByName.get(t) }));
  if (tagRows.length > 0) {
    const insTags = await supabase.from('product_tags').insert(tagRows);
    if (insTags.error) throw new Error(`product_tags 挿入失敗: ${insTags.error.message}`);
  }

  // 4) product_effects（既存を消して入れ直し）
  const delEff = await supabase.from('product_effects').delete().eq('product_id', productId);
  if (delEff.error) throw new Error(`product_effects 削除失敗: ${delEff.error.message}`);
  const effRows = (data.effects ?? []).map((e) => ({ product_id: productId, effect_id: masters.effectIdByName.get(e) }));
  if (effRows.length > 0) {
    const insEff = await supabase.from('product_effects').insert(effRows);
    if (insEff.error) throw new Error(`product_effects 挿入失敗: ${insEff.error.message}`);
  }

  // 5) buy_links（公式サイト行を upsert）
  const existingLink = await supabase
    .from('buy_links')
    .select('id')
    .eq('product_id', productId)
    .eq('shop_name', '公式サイト')
    .maybeSingle();
  if (existingLink.error) throw new Error(`buy_links 検索失敗: ${existingLink.error.message}`);
  const linkPayload = {
    product_id: productId,
    shop_name: '公式サイト',
    url: data.official_url ?? null,
    current_price: rep.price ?? null,
    last_check: new Date().toISOString(),
  };
  if (existingLink.data) {
    const updLink = await supabase.from('buy_links').update(linkPayload).eq('id', existingLink.data.id);
    if (updLink.error) throw new Error(`buy_links 更新失敗: ${updLink.error.message}`);
  } else {
    const insLink = await supabase.from('buy_links').insert(linkPayload);
    if (insLink.error) throw new Error(`buy_links 挿入失敗: ${insLink.error.message}`);
  }

  return { productId, action };
}

// ---- dry-run表示 ----
function printDryRun(url, data, validation) {
  const line = '─'.repeat(70);
  console.log(`\n${c.cyan}${line}${c.reset}`);
  console.log(`${c.bold}${data.name ?? '(name なし)'}${c.reset}`);
  console.log(`${c.gray}${url}${c.reset}`);
  console.log(line);
  console.log(`  type:         ${data.type}${data.new_type ? ` ${c.yellow}(新規type!)${c.reset}` : ''}`);
  console.log(`  is_set:       ${data.is_set}`);
  console.log(`  stock_status: ${data.stock_status}`);
  console.log('  variants:');
  const rep = pickRepresentativeVariant(data.variants);
  for (const v of data.variants ?? []) {
    const repMark = v === rep ? ` ${c.cyan}← 代表（products.price/volume）${c.reset}` : '';
    console.log(`    - ${v.volume} / ¥${v.price?.toLocaleString?.('ja-JP') ?? v.price}${repMark}`);
  }
  console.log(`  tags:         ${(data.tags ?? []).join('、') || '(なし)'}`);
  console.log(`  effects:      ${(data.effects ?? []).join('、') || '(なし)'}`);
  console.log('  notes:');
  for (const part of ['top', 'middle', 'base']) {
    console.log(`    ${part.padEnd(6)}: ${(data.notes?.[part] ?? []).join('、') || '(なし)'}`);
  }
  console.log(`  desc_ja:\n${c.gray}${(data.desc_ja ?? '').split('\n').map((l) => '    ' + l).join('\n')}${c.reset}`);
  console.log(`  desc_en: ${c.gray}${(data.desc_en ?? '').slice(0, 80)}...${c.reset}`);
  console.log(`  desc_ko: ${c.gray}${(data.desc_ko ?? '').slice(0, 80)}...${c.reset}`);
  console.log(`  desc_zh: ${c.gray}${(data.desc_zh ?? '').slice(0, 80)}...${c.reset}`);
  console.log(`  ingredients: ${data.ingredients ? c.gray + data.ingredients.slice(0, 100) + '...' + c.reset : 'null'}`);
  console.log(`  official_url: ${data.official_url}`);

  if (data.warnings?.length > 0) {
    console.log(`\n  ${c.yellow}${c.bold}■ モデルからの warnings:${c.reset}`);
    for (const w of data.warnings) console.log(`    ${c.yellow}⚠ ${w}${c.reset}`);
  }
  if (validation.skippedTags.length > 0) {
    console.log(`  ${c.yellow}${c.bold}■ マスタに無いためスキップした tags: ${validation.skippedTags.join('、')}${c.reset}`);
  }
  if (validation.truncatedTags.length > 0) {
    console.log(`  ${c.yellow}${c.bold}■ 7件超過のため切り詰めた tags: ${validation.truncatedTags.join('、')}${c.reset}`);
  }
  if (validation.skippedEffects.length > 0) {
    console.log(`  ${c.yellow}${c.bold}■ マスタに無いためスキップした effects: ${validation.skippedEffects.join('、')}${c.reset}`);
  }
  if (validation.errors.length > 0) {
    console.log(`\n  ${c.red}${c.bold}■ バリデーションエラー:${c.reset}`);
    for (const e of validation.errors) console.log(`    ${c.red}✖ ${e}${c.reset}`);
  }
}

// ---- メイン ----
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.brand) {
    err('使い方: node scripts/import-product.mjs --brand <ブランド名> [--save] [--headful] <URL1> <URL2> ...');
    err('--brand は必須です。');
    process.exit(1);
  }
  if (args.urls.length === 0) {
    err('URLを1件以上指定してください。');
    process.exit(1);
  }

  loadEnv();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anthropic = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から読む

  info('マスタ取得中...');
  const [brand, masters] = await Promise.all([
    resolveBrand(supabase, args.brand),
    fetchMasters(supabase),
  ]);
  console.log(
    `ブランド: ${c.bold}${brand.name}${c.reset} (id=${brand.id}) / ` +
      `type ${masters.types.length}件・tags ${masters.tags.length}件・effects ${masters.effects.length}件`
  );
  if (!args.save) {
    info('dry-run モード（--save を付けるとDBに保存します）');
  }

  const systemPrompt = await buildSystemPrompt(masters);
  const fetcher = await createPageFetcher(args.headful);
  const failures = [];

  try {
    for (let i = 0; i < args.urls.length; i++) {
      const url = args.urls[i];
      info(`\n[${i + 1}/${args.urls.length}] 処理中: ${url}`);
      try {
        const html = await fetcher.fetchHtml(url);
        const pageText = htmlToText(html, url);
        const data = await extractProduct(anthropic, systemPrompt, url, pageText);
        const validation = validateProduct(data, masters);
        printDryRun(url, data, validation);

        if (args.save) {
          if (validation.errors.length > 0) {
            throw new Error(`バリデーションエラーのため保存をスキップ: ${validation.errors.join(' / ')}`);
          }
          const { productId, action } = await saveProduct(supabase, brand, data, masters);
          console.log(`\n  ${c.green}${c.bold}✔ 保存完了（${action}） product_id=${productId}${c.reset}`);
        }
      } catch (e) {
        err(`失敗: ${url} — ${e.message}`);
        failures.push({ url, error: e.message });
      }
      if (i < args.urls.length - 1) {
        await new Promise((r) => setTimeout(r, 1000)); // 公式サイトへの負荷配慮
      }
    }
  } finally {
    await fetcher.close();
  }

  console.log(`\n${'═'.repeat(70)}`);
  const ok = args.urls.length - failures.length;
  console.log(`${c.green}成功: ${ok}件${c.reset} / ${failures.length > 0 ? c.red : ''}失敗: ${failures.length}件${c.reset}`);
  if (failures.length > 0) {
    console.log(`${c.red}${c.bold}失敗したURL:${c.reset}`);
    for (const f of failures) console.log(`  ${c.red}✖ ${f.url}${c.reset}\n    ${f.error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  err(`予期しないエラー: ${e.stack ?? e.message}`);
  process.exit(1);
});
