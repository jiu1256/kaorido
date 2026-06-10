# DBスキーマ（Supabase）

> **運用ルール:** スキーマを変更したら必ずこのファイルも更新する。

最終更新: 2026-06-10

## テーブル定義

| table_name      | column_name     | data_type                | is_nullable |
| --------------- | --------------- | ------------------------ | ----------- |
| brands          | id              | uuid                     | NO          |
| brands          | name            | text                     | NO          |
| brands          | abbr            | text                     | YES         |
| brands          | color_from      | text                     | YES         |
| brands          | color_to        | text                     | YES         |
| brands          | logo_color      | text                     | YES         |
| brands          | description_ja  | text                     | YES         |
| brands          | description_en  | text                     | YES         |
| brands          | official_url    | text                     | YES         |
| brands          | created_at      | timestamp with time zone | YES         |
| brands          | country         | text                     | YES         |
| brands          | logo_url        | text                     | YES         |
| brands          | scent_intro     | text                     | YES         |
| brands          | scent_types     | jsonb                    | YES         |
| buy_links       | id              | uuid                     | NO          |
| buy_links       | product_id      | uuid                     | NO          |
| buy_links       | shop_name       | text                     | NO          |
| buy_links       | url             | text                     | YES         |
| buy_links       | affiliate_code  | text                     | YES         |
| buy_links       | current_price   | integer                  | YES         |
| buy_links       | last_check      | timestamp with time zone | YES         |
| effects         | id              | uuid                     | NO          |
| effects         | name_ja         | text                     | YES         |
| effects         | name_en         | text                     | YES         |
| effects         | name_ko         | text                     | YES         |
| effects         | name_zh         | text                     | YES         |
| effects         | name_fr         | text                     | YES         |
| fragrance_notes | id              | uuid                     | NO          |
| fragrance_notes | product_id      | uuid                     | NO          |
| fragrance_notes | note_type       | text                     | NO          |
| fragrance_notes | ingredient_name | text                     | NO          |
| fragrance_notes | display_order   | integer                  | YES         |
| product_effects | product_id      | uuid                     | NO          |
| product_effects | effect_id       | uuid                     | NO          |
| product_ratings | id              | uuid                     | NO          |
| product_ratings | product_id      | uuid                     | YES         |
| product_ratings | score           | integer                  | YES         |
| product_ratings | created_at      | timestamp with time zone | YES         |
| product_tags    | product_id      | uuid                     | NO          |
| product_tags    | tag_id          | uuid                     | NO          |
| product_views   | id              | uuid                     | NO          |
| product_views   | product_id      | uuid                     | NO          |
| product_views   | viewed_at       | timestamp with time zone | YES         |
| product_views   | session_id      | text                     | YES         |
| products        | id              | uuid                     | NO          |
| products        | brand_id        | uuid                     | NO          |
| products        | name            | text                     | NO          |
| products        | type            | text                     | NO          |
| products        | price           | integer                  | YES         |
| products        | volume          | text                     | YES         |
| products        | rating          | numeric                  | YES         |
| products        | views           | integer                  | YES         |
| products        | favs            | integer                  | YES         |
| products        | desc_ja         | text                     | YES         |
| products        | desc_en         | text                     | YES         |
| products        | desc_ko         | text                     | YES         |
| products        | desc_zh         | text                     | YES         |
| products        | desc_fr         | text                     | YES         |
| products        | ingredients     | text                     | YES         |
| products        | gradient        | text                     | YES         |
| products        | is_published    | boolean                  | YES         |
| products        | created_at      | timestamp with time zone | YES         |
| products        | updated_at      | timestamp with time zone | YES         |
| products        | image_url       | text                     | YES         |
| products        | variants        | jsonb                    | YES         |
| products        | color_from      | text                     | YES         |
| products        | color_to        | text                     | YES         |
| products        | ingr_en         | text                     | YES         |
| products        | ingr_ko         | text                     | YES         |
| products        | ingr_zh         | text                     | YES         |
| tags            | id              | uuid                     | NO          |
| tags            | name            | text                     | NO          |
| tags            | category        | text                     | YES         |

## 抽出JSON → カラム対応（import-product.mjs の保存マッピング）

| 抽出JSONのフィールド | 保存先 | 備考 |
| --- | --- | --- |
| `desc_ja` / `desc_en` / `desc_ko` / `desc_zh` | `products.desc_ja` 等 | 名前一致なのでそのまま |
| `ingredients` / `ingr_en` / `ingr_ko` / `ingr_zh` | `products.ingredients` / `ingr_*` | 名前一致なのでそのまま |
| `variants` | `products.variants`（jsonb） | 代表値として**最大容量の variant**（volume の数値 ml/g 比較）の price/volume を `products.price` / `products.volume` に入れる。数値が読めない場合は variants[0]。`buy_links.current_price` も同じ代表 variant に合わせる |
| `notes` | `fragrance_notes` | **note_type は `top` / `mid` / `base`**（抽出JSONの `middle` は `mid` に変換）。display_order は note_type 別に **0始まり**連番（管理画面 Admin.jsx と同一規約） |
| `tags` / `effects` | `product_tags` / `product_effects` | マスタの id に解決して中間テーブルへ |
| `official_url` | `buy_links` | shop_name='公式サイト', url=official_url, current_price=variants[0].price |
| `stock_status` | **保存しない** | 対応カラムなし。dry-run表示と warnings のみ。在庫管理を本格化する際にカラム追加を検討 |
| `is_set` / `new_type` / `warnings` | **保存しない** | 処理用メタ情報 |

- `products.is_published` は保存時 `false`（管理画面で確認してから公開）
- upsert 方針: 同一 `brand_id` + `name` の商品が既に存在する場合は更新（重複登録防止）
- name のカタカナ読みは `name` に連結済み（専用カラムなし）
