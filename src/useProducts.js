// src/hooks/useProducts.js
// Supabaseからデータを取得するカスタムフック集
// コンポーネントで import { useProducts } from './hooks/useProducts' として使います

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── 言語コードのマッピング ───────────────────────────────
const LANG_KEY = {
  '日本語': 'ja',
  'English': 'en',
  '한국어':  'ko',
  '中文':   'zh',
  'Français': 'fr',
}

// ── Supabaseの行データをアプリの形式に変換 ────────────────
function formatProduct(p, langCode = 'ja') {
  const descField    = `desc_${langCode}`
  const effectField  = `name_${langCode}`

  // タグをシーン(scene)とそれ以外(scent/mood)に分ける
  const allTags  = (p.product_tags    || []).map(pt => pt.tags).filter(Boolean)
  const tags     = allTags.filter(t => t.category !== 'scene').map(t => t.name)
  const scenes   = allTags.filter(t => t.category === 'scene').map(t => t.name)

  // 効果・効能を言語に合わせて取得（その言語がなければ日本語にフォールバック）
  const effects = (p.product_effects || [])
    .map(pe => pe.effects?.[effectField] || pe.effects?.name_ja)
    .filter(Boolean)

  // フレグランスノートをTOP/MID/BASEに分類して並び順で整列
  const notesByType = type =>
    (p.fragrance_notes || [])
      .filter(n => n.note_type === type)
      .sort((a, b) => a.display_order - b.display_order)
      .map(n => n.ingredient_name)

  return {
    id:       p.id,
    name:     p.name,
    brand:    p.brands?.name    || '',
    type:     p.type,
    price:    p.price           || 0,
    volume:   p.volume          || '',
    variants: Array.isArray(p.variants) ? p.variants : [],
    rating:   parseFloat(p.rating) || 0,
    views:    p.views           || 0,
    favs:     p.favs            || 0,
    top:      notesByType('top'),
    mid:      notesByType('mid'),
    base:     notesByType('base'),
    tags,
    scenes,
    effects,
    buyLinks:  p.buy_links       || [],
    desc:      p[descField]      || p.desc_ja || '',
    ingr:      p.ingredients     || '',
    ingr_en:   p.ingr_en          || '',
    ingr_ko:   p.ingr_ko          || '',
    ingr_zh:   p.ingr_zh          || '',
    image_url: p.image_url       || '',
    g:         p.gradient        || 'linear-gradient(145deg,#E5DDD5,#C4B8A8)',
  }
}

// ── 商品一覧フック ────────────────────────────────────────
// 使い方: const { products, loading, error } = useProducts('日本語')
export function useProducts(lang = '日本語') {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const langCode = LANG_KEY[lang] || 'ja'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select(`
          *,
          brands(*),
          fragrance_notes(*),
          product_tags( tags(*) ),
          product_effects( effects(*) ),
          buy_links(*)
        `)
        .eq('is_published', true)
        .order('views', { ascending: false })

      if (err) throw err
      setProducts((data || []).map(p => formatProduct(p, langCode)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [langCode])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return { products, loading, error, refetch: fetchProducts }
}

// ── ブランド一覧フック ────────────────────────────────────
// 使い方: const { brands } = useBrands()
export function useBrands() {
  const [brands,  setBrands]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setBrands(data || [])
        setLoading(false)
      })
  }, [])

  // { brandName: brandData } の形のマップも返す
  const brandMap = Object.fromEntries(brands.map(b => [b.name, b]))
  return { brands, brandMap, loading }
}

// ── 閲覧数トラッキング ────────────────────────────────────
// 商品を開いたときに呼ぶ。同じセッション・同じ商品は1回だけ記録
export async function trackView(productId) {
  // セッションIDを取得（なければ新規生成）
  const sid = sessionStorage.getItem('sillage_sid') || (() => {
    const id = crypto.randomUUID()
    sessionStorage.setItem('sillage_sid', id)
    return id
  })()

  // このセッションでこの商品を既に見ていたらスキップ
  const key = `viewed_${productId}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  // ログを記録
  await supabase
    .from('product_views')
    .insert({ product_id: productId, session_id: sid })

  // 閲覧数カウントを +1
  await supabase
    .from('products')
    .update({ views: supabase.rpc('', {}) })  // 後述のSQL関数で更新
    .eq('id', productId)
}
