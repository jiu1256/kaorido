// 保存結果の検証: 指定 product_id の関連レコードを全テーブルから取得して表示
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const productId = process.argv[2];
if (!productId) {
  console.error('使い方: node scripts/verify-product.mjs <product_id>');
  process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const product = await supabase.from('products').select('*').eq('id', productId).single();
console.log('=== products ===');
if (product.error) console.error(product.error.message);
else {
  const p = product.data;
  console.log({
    name: p.name,
    type: p.type,
    price: p.price,
    volume: p.volume,
    variants: p.variants,
    is_published: p.is_published,
    desc_ja_len: p.desc_ja?.length,
    desc_en_len: p.desc_en?.length,
    desc_ko_len: p.desc_ko?.length,
    desc_zh_len: p.desc_zh?.length,
    ingredients: p.ingredients,
    ingr_en: p.ingr_en,
    ingr_ko: p.ingr_ko,
    ingr_zh: p.ingr_zh,
    created_at: p.created_at,
    updated_at: p.updated_at,
  });
}

const notes = await supabase.from('fragrance_notes').select('note_type, ingredient_name, display_order').eq('product_id', productId);
console.log(`\n=== fragrance_notes (${notes.data?.length ?? '?'}件) ===`);
if (notes.error) console.error(notes.error.message);
else for (const n of notes.data) console.log(n);

const tags = await supabase.from('product_tags').select('tag_id, tags(name)').eq('product_id', productId);
console.log(`\n=== product_tags (${tags.data?.length ?? '?'}件) ===`);
if (tags.error) console.error(tags.error.message);
else console.log(tags.data.map((t) => t.tags?.name).join('、'));

const effects = await supabase.from('product_effects').select('effect_id, effects(name_ja)').eq('product_id', productId);
console.log(`\n=== product_effects (${effects.data?.length ?? '?'}件) ===`);
if (effects.error) console.error(effects.error.message);
else console.log(effects.data.map((e) => e.effects?.name_ja).join('、'));

const links = await supabase.from('buy_links').select('shop_name, url, current_price, last_check').eq('product_id', productId);
console.log(`\n=== buy_links (${links.data?.length ?? '?'}件) ===`);
if (links.error) console.error(links.error.message);
else for (const l of links.data) console.log(l);
