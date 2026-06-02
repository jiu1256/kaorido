import { useState } from "react";
import { useProducts, useBrands, trackView } from "./hooks/useProducts";

const CATS = [
  {id:"all",l:"すべて"},
  {id:"香水",l:"香水"},{id:"ボディミスト",l:"ボディミスト"},{id:"ディフューザー",l:"ディフューザー"},
  {id:"お香",l:"お香"},{id:"アロマオイル",l:"アロマオイル"},{id:"ロールオン",l:"ロールオン"},
  {id:"アロマキャンドル",l:"アロマキャンドル"},{id:"ヘアオイル",l:"ヘアオイル"},{id:"ヘアミスト",l:"ヘアミスト"},
  {id:"ボディクリーム",l:"ボディクリーム"},{id:"柔軟剤",l:"柔軟剤"},{id:"ファブリックミスト",l:"ファブリックミスト"},
  {id:"ルームフレグランス",l:"ルームフレグランス"},{id:"サシェ",l:"サシェ"},{id:"バスソルト",l:"バスソルト"},
  {id:"ハンドクリーム",l:"ハンドクリーム"},{id:"ボディウォッシュ",l:"ボディウォッシュ"},{id:"練り香水",l:"練り香水"},
];
const TAG_GROUPS = [
  { label:"香りの系統", tags:["#フローラル","#シトラス","#ウッディ","#グルマン","#フルーティ","#クリーン","#セクシー","#ナチュラル","#パウダリー","#スパイシー","#アクア","#オリエンタル","#ハーバル","#ムスキー","#グリーン","#スモーキー","#レザー","#インセンス","#ベリー","#ミント","#フローラルフルーティ","#シトラスフローラル"] },
  { label:"シーン・用途", tags:["#デート","#オフィス","#リラックス","#春夏","#秋冬","#特別な日","#日常","#就寝前","#ヨガ","#読書","#夜","#リビング","#朝","#通勤","#お出かけ","#屋外","#お風呂上がり","#休日"] },
  { label:"印象・雰囲気", tags:["#フェミニン","#ユニセックス","#ラグジュアリー","#カジュアル","#清楚","#エレガント","#和","#明るい","#癒し","#アジアン","#甘い","#さわやか","#個性的","#大人っぽい","#可愛い","#ロマンティック","#華やか","#落ち着き","#初心者向け"] },
];
const BRAND_FALLBACK = {
  "Dior":{"g":"linear-gradient(145deg,#F8E6EC,#EDD0D8)","logo":"#8A2040","abbr":"Dior"},
  "Acqua di Parma":{"g":"linear-gradient(145deg,#FDEEC0,#F5D878)","logo":"#7A5010","abbr":"AdP"},
  "YSL":{"g":"linear-gradient(145deg,#1E1C1C,#2C2828)","logo":"#D4A820","abbr":"YSL"},
  "CHANEL":{"g":"linear-gradient(145deg,#1A1818,#2A2828)","logo":"#E8E0D8","abbr":"CHANEL"},
  "Jo Malone":{"g":"linear-gradient(145deg,#F5EDE0,#E8D8C4)","logo":"#4A3020","abbr":"JM"},
  "KUUMBA":{"g":"linear-gradient(145deg,#C8E8D8,#90C8B0)","logo":"#1A4030","abbr":"K"},
  "Elizabeth Arden":{"g":"linear-gradient(145deg,#F0C8D8,#D898B8)","logo":"#681840","abbr":"EA"},
  "SABON":{"g":"linear-gradient(145deg,#C8D0E8,#9098C8)","logo":"#202068","abbr":"SABON"},
  "JURLIQUE":{"g":"linear-gradient(145deg,#D4E8C0,#A8D090)","logo":"#284820","abbr":"JUR"},
  "L'OCCITANE":{"g":"linear-gradient(145deg,#DCD0E8,#B890C8)","logo":"#401860","abbr":"L'O"},
  "MARKS & WEB":{"g":"linear-gradient(145deg,#EAE8E0,#D8D4C8)","logo":"#2A2A20","abbr":"M&W"},
};
const B_DEF = { g:"linear-gradient(145deg,#E8E4E0,#D4D0CC)", logo:"#3A3A3A", abbr:"◈" };
const CUR_SYM = { JPY:"¥", USD:"$", EUR:"€", GBP:"£", KRW:"₩", CNY:"¥", CAD:"CA$", AUD:"A$", SEK:"kr", CHF:"CHF" };
function formatPrice(price, currency) {
  if (!price) return "—";
  const sym = CUR_SYM[currency] || "";
  return sym + Number(price).toLocaleString();
}

// バリアントが複数ある場合は価格帯を返す
function formatPriceRange(product) {
  const variants = Array.isArray(product.variants) ? product.variants.filter(v=>v.price) : [];
  if (variants.length <= 1) {
    return formatPrice(product.price, variants[0]?.currency||"JPY");
  }
  // 円換算価格（jpy_price優先、なければpriceそのまま）を使って最安・最高を計算
  const prices = variants.map(v=>v.currency==="JPY"||!v.currency ? Number(v.price) : (v.jpy_price||Number(v.price))).filter(Boolean);
  if (!prices.length) return formatPrice(product.price, "JPY");
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return "¥" + min.toLocaleString();
  return "¥" + min.toLocaleString() + "〜" + max.toLocaleString();
}
const COUNTRY_LIST = [
  {code:"JP",flag:"🇯🇵",name:"日本"},{code:"KR",flag:"🇰🇷",name:"韓国"},{code:"CN",flag:"🇨🇳",name:"中国"},
  {code:"US",flag:"🇺🇸",name:"アメリカ"},{code:"FR",flag:"🇫🇷",name:"フランス"},{code:"GB",flag:"🇬🇧",name:"イギリス"},
  {code:"IT",flag:"🇮🇹",name:"イタリア"},{code:"DE",flag:"🇩🇪",name:"ドイツ"},{code:"ES",flag:"🇪🇸",name:"スペイン"},
  {code:"SE",flag:"🇸🇪",name:"スウェーデン"},{code:"NL",flag:"🇳🇱",name:"オランダ"},{code:"AU",flag:"🇦🇺",name:"オーストラリア"},
  {code:"CA",flag:"🇨🇦",name:"カナダ"},{code:"OTHER",flag:"🌍",name:"その他"},
];
const SORTS = [{v:"views",l:"閲覧数順"},{v:"favs",l:"お気に入り順"},{v:"price_asc",l:"安い順"},{v:"price_desc",l:"高い順"},{v:"rating",l:"評価順"}];
const LANGS = ["日本語","English","한국어","中文","Français"];
const T = {
  "日本語":{ about:"紹介", notes:"フレグランスノート", top:"トップ", mid:"ミドル", base:"ベース", effects:"効果・効能", ingr:"成分・詳細", ingrShow:"表示する（公式サイト記載）", ingrHide:"折りたたむ", buy:"購入先", buyPre:"", buySuf:" で見る", similar:"似ている香り", brandLink:"→ ブランドページ", home:"ホーム", ranking:"ランキング", favNav:"お気に入り", searchPh:"香水名・ブランド・#フローラルなどで検索...", tagBtn:"タグで探す", brandBtn:"ブランドから探す", brandPh:"ブランド名を入力...", back:"戻る", items:"件", noFav:"お気に入りはまだありません", noFavSub:"カードの ♡ ボタンで登録できます", noResult:"条件に合う商品が見つかりませんでした", selected:"件選択中", clearAll:"すべて解除", loading:"読み込み中...", error:"データの取得に失敗しました", simTitle:"類似検索", simPh:"商品名・ブランド・#タグで入力..." },
  "English":{ about:"About", notes:"Fragrance Notes", top:"Top", mid:"Middle", base:"Base", effects:"Effects & Benefits", ingr:"Ingredients", ingrShow:"Show (from official site)", ingrHide:"Hide", buy:"Where to Buy", buyPre:"View on ", buySuf:"", similar:"Similar Fragrances", brandLink:"→ Brand Page", home:"Home", ranking:"Rankings", favNav:"Favorites", searchPh:"Search by name, brand, #floral...", tagBtn:"Filter by Tags", brandBtn:"Browse Brands", brandPh:"Search brand name...", back:"Back", items:" results", noFav:"No favorites yet", noFavSub:"Tap ♡ on any product card", noResult:"No products found", selected:" selected", clearAll:"Clear all", loading:"Loading...", error:"Failed to load data", simTitle:"Similar Search", simPh:"Product name, brand, or #tag..." },
  "한국어":{ about:"소개", notes:"프래그런스 노트", top:"탑 노트", mid:"미들 노트", base:"베이스 노트", effects:"효능", ingr:"성분 · 상세", ingrShow:"표시하기", ingrHide:"접기", buy:"구매처", buyPre:"", buySuf:"에서 보기", similar:"비슷한 향기", brandLink:"→ 브랜드 페이지", home:"홈", ranking:"랭킹", favNav:"즐겨찾기", searchPh:"향수명·브랜드·#플로럴로 검색...", tagBtn:"태그로 찾기", brandBtn:"브랜드로 찾기", brandPh:"브랜드 이름...", back:"돌아가기", items:"개", noFav:"즐겨찾기가 없습니다", noFavSub:"카드의 ♡ 버튼으로 등록", noResult:"검색 결과 없음", selected:"개 선택", clearAll:"모두 해제", loading:"로딩 중...", error:"데이터 로딩 실패", simTitle:"유사 검색", simPh:"상품명·브랜드·#태그 입력..." },
  "中文":{ about:"产品介绍", notes:"香调", top:"前调", mid:"中调", base:"后调", effects:"功效与益处", ingr:"成分 · 详情", ingrShow:"显示", ingrHide:"收起", buy:"购买途径", buyPre:"在", buySuf:"查看", similar:"相似香水", brandLink:"→ 品牌页面", home:"首页", ranking:"排行榜", favNav:"收藏", searchPh:"搜索香水名、品牌、#花香...", tagBtn:"按标签筛选", brandBtn:"按品牌浏览", brandPh:"输入品牌名称...", back:"返回", items:"件", noFav:"暂无收藏", noFavSub:"点击 ♡ 进行收藏", noResult:"未找到相关商品", selected:"项已选", clearAll:"清除全部", loading:"加载中...", error:"数据加载失败", simTitle:"相似搜索", simPh:"输入商品名·品牌·#标签..." },
  "Français":{ about:"Présentation", notes:"Notes de Parfum", top:"Note de tête", mid:"Note de cœur", base:"Note de fond", effects:"Bienfaits", ingr:"Ingrédients", ingrShow:"Afficher", ingrHide:"Réduire", buy:"Où Acheter", buyPre:"Voir sur ", buySuf:"", similar:"Parfums Similaires", brandLink:"→ Page Marque", home:"Accueil", ranking:"Classement", favNav:"Favoris", searchPh:"Rechercher nom, marque, #floral...", tagBtn:"Filtrer par tags", brandBtn:"Parcourir les marques", brandPh:"Rechercher une marque...", back:"Retour", items:" résultats", noFav:"Aucun favori", noFavSub:"Appuyez sur ♡ sur une carte", noResult:"Aucun produit trouvé", selected:" sélectionné(s)", clearAll:"Tout effacer", loading:"Chargement...", error:"Erreur de chargement", simTitle:"Recherche Similaire", simPh:"Nom·marque·#tag..." },
};

// ── 類似度スコア計算 ────────────────────────────────────────
function getSimilarProducts(target, allProducts, topN=8) {
  return allProducts.filter(p=>p.id!==target.id).map(p=>{
    let score=0;
    if(p.type===target.type) score+=3;
    if(p.brand===target.brand) score+=2;
    score += p.tags.filter(t=>target.tags.includes(t)).length;
    score += p.scenes.filter(s=>target.scenes.includes(s)).length;
    score += p.top.filter(n=>target.top.includes(n)).length*2;
    score += p.mid.filter(n=>target.mid.includes(n)).length;
    score += p.base.filter(n=>target.base.includes(n)).length;
    return {...p,_score:score};
  }).filter(p=>p._score>0).sort((a,b)=>b._score-a._score).slice(0,topN);
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
.lf{font-family:Georgia,'Times New Roman',serif;}
.card{background:#fff;border-radius:12px;overflow:visible;border:1px solid #E5DDD5;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease;position:relative;}
.card:hover{transform:translateY(-5px);box-shadow:0 18px 44px rgba(50,25,8,.13);}
.card-img{height:138px;position:relative;overflow:hidden;border-radius:12px 12px 0 0;flex-shrink:0;}
.fav-btn{background:rgba(255,255,255,.88);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;}
.fav-btn:hover{transform:scale(1.2);}
.card-fav{position:absolute;top:6px;right:6px;width:30px;height:30px;z-index:10;}
.tpill{border-radius:12px;font-size:11px;padding:3px 9px;cursor:pointer;transition:all .15s;user-select:none;}
.cbt{border-radius:20px;font-size:12px;padding:5px 14px;border:1px solid #E5DDD5;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit;background:#FAF7F3;color:#6B5E55;}
.cbt:hover{border-color:#C4885A;color:#C4885A;}.cbt.on{background:#C4885A!important;color:#fff!important;border-color:#C4885A!important;}
.nvb{font-size:13px;cursor:pointer;padding:4px 0;border-bottom:2px solid transparent;transition:all .15s;user-select:none;}.nvb:hover{color:#C4885A;}.nvb.on{color:#C4885A!important;border-bottom-color:#C4885A;}
.ssel{background:#FAF7F3;border:1px solid #E5DDD5;border-radius:7px;padding:6px 10px;font-size:12px;color:#6B5E55;cursor:pointer;outline:none;font-family:inherit;}
.bbt{border-radius:7px;padding:9px 0;font-size:12px;cursor:pointer;font-family:inherit;border:1px solid #C4885A;transition:all .15s;}
.bbt.fill{background:#C4885A;color:#fff;}.bbt.fill:hover{background:#A8714A;}
.bbt.out{background:transparent;color:#C4885A;}.bbt.out:hover{background:#C4885A;color:#fff;}
.bbt.disabled{opacity:.4;cursor:default;pointer-events:none;}
.si input{outline:none;border:1.5px solid #E5DDD5;border-radius:24px;padding:10px 18px 10px 44px;font-size:14px;width:100%;transition:border-color .2s;background:#fff;color:#1C1815;font-family:inherit;}
.si input:focus{border-color:#C4885A;}
.si.sm input{padding:8px 14px 8px 38px;font-size:13px;border-radius:20px;}
.ovl{position:fixed;inset:0;background:rgba(28,24,21,.65);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;}
.mbox{background:#FAF7F3;border-radius:16px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;}
.ldd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #E5DDD5;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.1);z-index:200;min-width:112px;overflow:hidden;}
.ldi{padding:9px 16px;font-size:12px;cursor:pointer;color:#6B5E55;transition:background .1s;}.ldi:hover{background:#F0EAE3;}
.rbdg{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;z-index:10;}
.tag-panel{background:#fff;border:1px solid #E5DDD5;border-radius:10px;padding:14px 16px;margin-top:8px;}
.tog-btn{display:flex;align-items:center;gap:7px;background:none;border:1px solid #E5DDD5;border-radius:20px;padding:5px 14px;font-size:12px;color:#6B5E55;cursor:pointer;font-family:inherit;transition:all .15s;}
.tog-btn:hover{border-color:#C4885A;color:#C4885A;}.tog-btn.active{background:#C4885A;color:#fff;border-color:#C4885A;}
.ingr-toggle{display:flex;align-items:center;gap:6px;background:none;border:none;font-size:11px;color:#8B7B72;cursor:pointer;font-family:inherit;padding:0;}.ingr-toggle:hover{color:#C4885A;}
.back-btn{display:flex;align-items:center;gap:6px;background:none;border:1px solid #E5DDD5;border-radius:20px;padding:5px 14px;font-size:12px;color:#6B5E55;cursor:pointer;font-family:inherit;transition:all .15s;}.back-btn:hover{border-color:#C4885A;color:#C4885A;}
.brand-card{background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E5DDD5;cursor:pointer;transition:all .18s;position:relative;}
.brand-card:hover{box-shadow:0 6px 18px rgba(50,25,8,.12);transform:translateY(-3px);}
.brand-card.on{border-color:#C4885A;box-shadow:0 0 0 2px #C4885A40;}
.spin{display:inline-block;width:28px;height:28px;border:3px solid #E5DDD5;border-top-color:#C4885A;border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.official-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#C4885A;text-decoration:none;border:1px solid #C4885A;border-radius:20px;padding:5px 14px;transition:all .15s;cursor:pointer;}
.official-btn:hover{background:#C4885A;color:#fff;}
/* ── モバイル対応 ───────────────────────── */
@media(max-width:640px){
  .card:hover{transform:none;box-shadow:none;}
  .brand-card:hover{transform:none;box-shadow:none;}
  /* モーダルは下から出現 */
  .mbox{border-radius:16px 16px 0 0;max-height:94vh;}
  .ovl{align-items:flex-end;padding:0;}
  /* PC用ナビを完全に隠す */
  .sp-hide{display:none!important;}
  /* スマホ下部ナビ */
  .sp-nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E5DDD5;display:flex!important;justify-content:space-around;align-items:center;padding:6px 0 env(safe-area-inset-bottom,8px);z-index:100;}
  /* グリッド */
  .sp-grid2{grid-template-columns:1fr 1fr!important;}
  /* メインのパディング（下部ナビ分の余白） */
  .sp-p{padding:12px 14px 72px!important;}
  /* ヘッダー */
  .sp-header{height:48px!important;padding:0 12px!important;}
  .sp-logo{font-size:16px!important;}
  /* ヒーロー */
  .sp-hero{padding:14px 16px!important;gap:10px!important;}
  .sp-hero-h1{font-size:16px!important;white-space:normal!important;}
  .sp-hero-sub{display:none!important;}
  .sp-hero-sym{font-size:28px!important;}
  /* カテゴリ横スクロール */
  .sp-cats{flex-wrap:nowrap!important;overflow-x:auto!important;padding-bottom:4px!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;}
  .sp-cats::-webkit-scrollbar{display:none;}
  .sp-cats .cbt{font-size:11px!important;padding:4px 10px!important;flex-shrink:0!important;}
  /* 購入ボタンを1列に */
  .buy-grid{grid-template-columns:1fr!important;}
  .si input{font-size:13px;}
}
`;

// ── フレグランスノート辞書 ────────────────────────────────
const NOTE_INFO = {
  // シトラス
  "ベルガモット":   {emoji:"🍋",en:"Bergamot",   desc:"イタリア産柑橘。爽やかな苦みと甘みが特徴のシトラス系の代表格。"},
  "レモン":         {emoji:"🍋",en:"Lemon",      desc:"フレッシュで明るい柑橘感。クリーンで軽やかな印象を与える。"},
  "グレープフルーツ":{emoji:"🍊",en:"Grapefruit", desc:"苦みと甘みが絶妙なシトラス。元気でエネルギッシュな香り。"},
  "オレンジ":       {emoji:"🍊",en:"Orange",     desc:"明るく甘い柑橘。フルーティで親しみやすい香り。"},
  "ライム":         {emoji:"🍋",en:"Lime",       desc:"シャープで清涼感のある柑橘。クリーンで爽快。"},
  "ユズ":           {emoji:"🍋",en:"Yuzu",       desc:"日本原産の柑橘。清々しい和の柑橘感と独特の苦み。"},
  "マンダリン":     {emoji:"🍊",en:"Mandarin",   desc:"甘くみずみずしいオレンジ系。柔らかく穏やかな香り。"},
  // フルーティ
  "アップル":       {emoji:"🍎",en:"Apple",      desc:"フレッシュな青リンゴからジューシーな赤リンゴまで。爽やかで甘い果実感。"},
  "ピーチ":         {emoji:"🍑",en:"Peach",      desc:"官能的で甘美な果物の香り。温かみとジューシー感。"},
  "アプリコット":   {emoji:"🍑",en:"Apricot",    desc:"甘くほんのり酸味のある果実感。優しくフルーティ。"},
  "ポメグラネイト": {emoji:"🫐",en:"Pomegranate",desc:"甘酸っぱく複雑なザクロの香り。エキゾチックで深みがある。"},
  "ベリー":         {emoji:"🫐",en:"Berry",      desc:"フレッシュな赤い果実の香り。甘くジューシーで生き生きとした印象。"},
  "ブラックカラント":{emoji:"🫐",en:"Blackcurrant",desc:"濃厚でフルーティな黒スグリ。甘酸っぱく個性的な香り。"},
  "ペアー":         {emoji:"🍐",en:"Pear",       desc:"フレッシュで軽やかな梨の香り。みずみずしく上品。"},
  // フローラル
  "ローズ":         {emoji:"🌹",en:"Rose",       desc:"香水の女王。華やかで甘く深みのある最もクラシックな花の香り。"},
  "ジャスミン":     {emoji:"🌸",en:"Jasmine",    desc:"甘く官能的な白い花。香水の核として多くの名香に使われる。"},
  "ピオニー":       {emoji:"🌸",en:"Peony",      desc:"フレッシュで華やかな牡丹の香り。ロマンティックで春らしい。"},
  "ミュゲ":         {emoji:"🌱",en:"Lily of the Valley",desc:"すずらんの清楚で可憐な香り。フレッシュで純粋な白い花。"},
  "フリージア":     {emoji:"🌼",en:"Freesia",    desc:"甘くフレッシュな春の花。軽やかで明るいフローラル。"},
  "アイリス":       {emoji:"🌸",en:"Iris",       desc:"パウダリーで気品あるアヤメ。洗練された上質感を演出。"},
  "チューリップ":   {emoji:"🌷",en:"Tulip",      desc:"繊細でフレッシュな春の花。ほのかに甘いクリーンフローラル。"},
  "マグノリア":     {emoji:"🌸",en:"Magnolia",   desc:"白く大きな花。クリーミーで甘く、エレガントな存在感。"},
  "ガーデニア":     {emoji:"🌸",en:"Gardenia",   desc:"クリーミーで甘い白い花。官能的でリッチな香り。"},
  // グリーン・ハーバル
  "グリーン":       {emoji:"🌿",en:"Green",      desc:"草や葉の青さ。自然でフレッシュなアウトドア感。"},
  "バジル":         {emoji:"🌿",en:"Basil",      desc:"スパイシーで爽やかなハーブ。地中海の太陽を思わせる。"},
  "ミント":         {emoji:"🌿",en:"Mint",       desc:"クールで清涼感のあるハーブ。フレッシュな清潔感を演出。"},
  "ラベンダー":     {emoji:"💜",en:"Lavender",   desc:"穏やかでリラックスできるハーバルフローラル。安眠・鎮静効果も。"},
  "タイム":         {emoji:"🌿",en:"Thyme",      desc:"爽やかでスパイシーな地中海のハーブ。"},
  // ウッディ・アーシー
  "サンダルウッド": {emoji:"🪵",en:"Sandalwood", desc:"クリーミーで温かい白檀の香り。東洋的で瞑想的な深み。"},
  "シダー":         {emoji:"🌲",en:"Cedar",      desc:"ドライでクリーンな木の香り。すっきりとした森の清潔感。"},
  "ヴェティバー":   {emoji:"🌾",en:"Vetiver",    desc:"スモーキーでアーシーな根の香り。深くミステリアス。"},
  "パチョリ":       {emoji:"🌿",en:"Patchouli",  desc:"深くアーシーでエキゾチック。独特の個性と持続力。"},
  "オード":         {emoji:"🪵",en:"Oud",        desc:"沈香の深くスモーキーな香り。中東の高級香木。非常に希少。"},
  "ヒノキ":         {emoji:"🌲",en:"Hinoki",     desc:"日本の檜。清々しく清潔感のある和の木の香り。"},
  "白檀":           {emoji:"🪵",en:"Sandalwood", desc:"クリーミーで温かみのある上品な木の香り。"},
  // スパイシー
  "ペッパー":       {emoji:"🌶",en:"Pepper",     desc:"刺激的でスパイシー。ダイナミックで個性的な香り。"},
  "カルダモン":     {emoji:"🌶",en:"Cardamom",   desc:"エキゾチックで甘みのあるスパイス。温かく複雑な香り。"},
  "シナモン":       {emoji:"🍂",en:"Cinnamon",   desc:"甘くスパイシーな温かみ。秋冬の定番スパイスノート。"},
  "ジンジャー":     {emoji:"🫚",en:"Ginger",     desc:"ピリッとした生姜の刺激。フレッシュでエネルギッシュ。"},
  // バニラ・グルマン
  "バニラ":         {emoji:"🍦",en:"Vanilla",    desc:"甘くクリーミーな温かみ。官能的でリッチなベースノート。"},
  "トンカビーン":   {emoji:"🫘",en:"Tonka Bean", desc:"クマリンと甘アーモンドの香り。甘く幸福感のあるグルマン系。"},
  "キャラメル":     {emoji:"🍬",en:"Caramel",    desc:"甘く焦げた砂糖の香り。温かく幸福感のあるデザート系。"},
  // ムスク・アンバー
  "ムスク":         {emoji:"✨",en:"Musk",       desc:"肌に溶け込む官能的な白い香り。清潔感と温かみの定番。"},
  "ホワイトムスク": {emoji:"✨",en:"White Musk", desc:"清潔でクリーンな現代的なムスク。石鹸のような爽やかさ。"},
  "アンバー":       {emoji:"🫙",en:"Amber",      desc:"温かくリッチで甘い樹脂系香料。深みと官能性を与える。"},
  "アンブレット":   {emoji:"🌸",en:"Ambrette",   desc:"植物性ムスク。柔らかくフルーティな動物的香り。"},
};
const NOTE_FAMILY_COLOR = {
  "シトラス":"#F5A623","フローラル":"#E8739A","フルーティ":"#E8A0BF",
  "ウッディ":"#8B6914","ムスク":"#9B8EA8","オリエンタル":"#C4885A",
  "グルマン":"#C47A3A","スパイシー":"#D04040","ハーバル":"#4A8C5C","グリーン":"#4A7C59",
};

function Stars({n}) {
  return (
    <span style={{display:"flex",alignItems:"center",gap:2}}>
      {[1,2,3,4,5].map(i=>(<svg key={i} width="11" height="10" viewBox="0 0 11 10"><polygon points="5.5,0.5 6.9,3.8 10.5,3.8 7.7,5.9 8.7,9.2 5.5,7.2 2.3,9.2 3.3,5.9 0.5,3.8 4.1,3.8" fill={i<=Math.round(n)?"#C4885A":"#E5DDD5"}/></svg>))}
      <span style={{fontSize:11,color:"#8B7B72",marginLeft:3}}>{n.toFixed(1)}</span>
    </span>
  );
}

// クリックで評価できる星コンポーネント
function StarRating({ productId, currentRating }) {
  const [hover,  setHover]  = useState(0);
  const [myRate, setMyRate] = useState(()=>{
    try { return parseInt(localStorage.getItem("rate_"+productId)||"0"); } catch { return 0; }
  });
  const [submitted, setSubmitted] = useState(!!myRate);
  const [avg, setAvg] = useState(currentRating||0);
  const [count, setCount] = useState(0);

  useEffect(()=>{
    // 平均評価を取得
    import("./lib/supabase").then(({supabase})=>{
      supabase.from("product_ratings").select("score").eq("product_id",productId).then(({data})=>{
        if (data?.length) {
          const scores = data.map(r=>r.score);
          setAvg(scores.reduce((a,b)=>a+b,0)/scores.length);
          setCount(scores.length);
        }
      });
    });
  },[productId]);

  const submit = async (score) => {
    if (submitted) return;
    try {
      const {supabase} = await import("./lib/supabase");
      await supabase.from("product_ratings").insert([{product_id:productId, score}]);
      localStorage.setItem("rate_"+productId, String(score));
      setMyRate(score); setSubmitted(true);
      setAvg(prev=>(prev*count+score)/(count+1)); setCount(c=>c+1);
    } catch(e) { console.error(e); }
  };

  const display = hover || myRate || avg;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        {[1,2,3,4,5].map(i=>(
          <svg key={i} width="20" height="18" viewBox="0 0 11 10"
            style={{cursor:submitted?"default":"pointer",transition:"transform .1s",transform:hover>=i?"scale(1.2)":"scale(1)"}}
            onMouseEnter={()=>!submitted&&setHover(i)}
            onMouseLeave={()=>!submitted&&setHover(0)}
            onClick={()=>!submitted&&submit(i)}>
            <polygon points="5.5,0.5 6.9,3.8 10.5,3.8 7.7,5.9 8.7,9.2 5.5,7.2 2.3,9.2 3.3,5.9 0.5,3.8 4.1,3.8"
              fill={i<=Math.round(display)?"#C4885A":"#E5DDD5"}/>
          </svg>
        ))}
        <span style={{fontSize:12,color:"#8B7B72",marginLeft:4}}>
          {avg>0?avg.toFixed(1):"—"}
          {count>0&&<span style={{fontSize:10,color:"#B0A098"}}> ({count}件)</span>}
        </span>
      </div>
      {submitted
        ? <p style={{fontSize:10,color:"#C4885A",marginTop:3}}>★ あなたの評価: {myRate}点　ありがとうございます！</p>
        : <p style={{fontSize:10,color:"#B0A098",marginTop:3}}>星をタップして評価できます</p>
      }
    </div>
  );
}
function Bottle({style:s}) {
  return (
    <svg style={s} viewBox="0 0 36 60" fill="none">
      <rect x="13" y="1" width="10" height="11" rx="3" fill="white" opacity=".45"/>
      <path d="M9 15 Q7 18 7 22 L7 50 Q7 56 13 56 L23 56 Q29 56 29 50 L29 22 Q29 18 27 15 Z" fill="white" opacity=".35"/>
    </svg>
  );
}

function TagPanel({groups,selected,onToggle}) {
  return (
    <div className="tag-panel">
      {groups.map((g,gi)=>(
        <div key={g.label} style={{marginBottom:gi<groups.length-1?12:0}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:7}}>{g.label}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {g.tags.map(t=>(<span key={t} className="tpill" style={{background:selected.includes(t)?"#C4885A":"#F0EAE3",color:selected.includes(t)?"#fff":"#8B7B72"}} onClick={()=>onToggle(t)}>{t}</span>))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandCard({brand,dbInfo,isOn,onClick,favBrands,onFavBrand}) {
  const local = BRAND_FALLBACK[brand]||B_DEF;
  const g   = dbInfo?.color_from&&dbInfo?.color_to?`linear-gradient(145deg,${dbInfo.color_from},${dbInfo.color_to})`:local.g;
  const logo = dbInfo?.logo_color||local.logo;
  const abbr = dbInfo?.abbr||local.abbr||brand.slice(0,3).toUpperCase();
  const fs   = abbr.length>5?11:abbr.length>3?14:20;
  const flag = COUNTRY_LIST.find(c=>c.code===dbInfo?.country)?.flag||"";
  const isFav = favBrands?.has(brand);
  return (
    <div className={`brand-card${isOn?" on":""}`} onClick={onClick}>
      <div style={{height:68,background:g,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {dbInfo?.logo_url?<img src={dbInfo.logo_url} style={{width:48,height:48,objectFit:"contain"}} alt={brand}/>
          :<span style={{fontFamily:"Georgia,serif",fontSize:fs,fontWeight:400,color:logo,letterSpacing:".12em"}}>{abbr}</span>}
        {flag&&<span style={{position:"absolute",top:5,right:6,fontSize:15,lineHeight:1}}>{flag}</span>}
        <button className="fav-btn" style={{position:"absolute",top:5,left:6,width:24,height:24,background:"rgba(255,255,255,.8)"}}
          onClick={e=>{e.stopPropagation();onFavBrand&&onFavBrand(brand);}}>
          <svg width="11" height="10" viewBox="0 0 14 12"><path d="M7 10.5S1 6.8 1 3.2A2.8 2.8 0 0 1 7 1.5 2.8 2.8 0 0 1 13 3.2C13 6.8 7 10.5 7 10.5z" fill={isFav?"#E05C70":"none"} stroke={isFav?"#E05C70":"#888"} strokeWidth="1.4"/></svg>
        </button>
      </div>
      <div style={{padding:"6px 8px 8px",textAlign:"center",minHeight:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:10,fontWeight:500,color:isOn?"#C4885A":"#1C1815",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{brand}</p>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ── ハートをcardの外（z-index:10で最前面）に配置 ──
function Card({p,rank,fav,onFav,onClick}) {
  return (
    <div className="card" onClick={onClick}>
      {rank!==null&&rank<3&&(
        <div className="rbdg" style={{background:rank===0?"#C4885A":rank===1?"#9A9693":"#B8916A"}}>{rank+1}</div>
      )}
      {/* ハートボタン：card直下に配置でoverflowに影響されない */}
      <button className="fav-btn card-fav" onClick={e=>{e.stopPropagation();onFav(p.id);}}>
        <svg width="14" height="12" viewBox="0 0 14 12">
          <path d="M7 10.5S1 6.8 1 3.2A2.8 2.8 0 0 1 7 1.5 2.8 2.8 0 0 1 13 3.2C13 6.8 7 10.5 7 10.5z"
            fill={fav?"#E05C70":"none"} stroke={fav?"#E05C70":"#777"} strokeWidth="1.4"/>
        </svg>
      </button>
      <div className="card-img" style={{background:p.g}}>
        {p.image_url
          ?<img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",background:"#fff",padding:"6px"}}/>
          :<Bottle style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",width:36,height:58}}/>
        }
        <span style={{position:"absolute",bottom:7,right:9,background:"rgba(0,0,0,.22)",color:"#fff",fontSize:10,padding:"2px 7px",borderRadius:8}}>{p.type}</span>
      </div>
      <div style={{padding:"11px 13px"}}>
        <p style={{fontSize:10,color:"#C4885A",fontWeight:600,letterSpacing:".06em",marginBottom:2}}>{p.brand}</p>
        <p style={{fontSize:13,fontWeight:500,color:"#1C1815",lineHeight:1.4,marginBottom:6}}>{p.name}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
          {p.tags.slice(0,2).map(t=>(<span key={t} style={{background:"#F0EAE3",color:"#8B7B72",fontSize:10,padding:"2px 7px",borderRadius:8}}>{t}</span>))}
          {p.scenes.slice(0,1).map(s=>(<span key={s} style={{background:"#EAF0E8",color:"#5A7A62",fontSize:10,padding:"2px 7px",borderRadius:8}}>{s}</span>))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <Stars n={p.rating}/>
          <span style={{fontSize:14,fontWeight:600,color:"#1C1815"}}>{formatPriceRange(p)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"#B0A098"}}>{p.volume}</span>
          <span style={{fontSize:10,color:fav?"#E05C70":"#B0A098"}}>♡ {fav?p.favs+1:p.favs}</span>
        </div>
      </div>
    </div>
  );
}
function Modal({p,fav,onFav,recs,onClose,onSelect,onBrand,lang,onNoteClick}) {
  const [showIngr,setShowIngr]=useState(false);
  const [selVariant,setSelVariant]=useState(0);
  const [selImage,setSelImage]=useState(0);
  const t=T[lang]||T["日本語"];
  // バリアントを価格の安い順に並び替え
  const rawVariants=Array.isArray(p.variants)&&p.variants.length>0?p.variants:null;
  const variants=rawVariants?[...rawVariants].sort((a,b)=>{
    const pa=a.currency==="JPY"||!a.currency?Number(a.price):(a.jpy_price||Number(a.price));
    const pb=b.currency==="JPY"||!b.currency?Number(b.price):(b.jpy_price||Number(b.price));
    return pa-pb;
  }):null;
  const selVar=variants?variants[selVariant]:null;
  const varImgs=selVar?.images?.filter(Boolean)||[];
  const allImgs=varImgs.length>0?varImgs:(p.image_url?[p.image_url]:[]);
  const currentImg=allImgs[selImage]||null;
  const changeVariant=(i)=>{setSelVariant(i);setSelImage(0);};
  const displayPrice=selVar?.price||p.price;
  const displayCur=selVar?.currency||p.variants?.[0]?.currency||"JPY";
  const displayJpy=selVar?.jpy_price;
  const displayVol=selVar?.volume||p.volume;
  const shops=p.buyLinks?.length>0?p.buyLinks:[{shop_name:"Amazon",url:null},{shop_name:"楽天市場",url:null},{shop_name:"Yahoo! ショッピング",url:null},{shop_name:"公式サイト",url:null}];
  return (
    <div className="ovl" onClick={onClose}>
      <div className="mbox" onClick={e=>e.stopPropagation()}>
        <div style={{height:200,background:currentImg?"#fff":p.g,position:"relative",borderRadius:"16px 16px 0 0",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {currentImg?<img src={currentImg} alt={p.name} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",padding:"10px"}}/>
            :<Bottle style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",width:50,height:80}}/>}
          <button className="fav-btn" style={{position:"absolute",top:12,right:50,width:34,height:34,background:"rgba(255,255,255,.88)"}} onClick={e=>{e.stopPropagation();onFav(p.id);}}>
            <svg width="16" height="14" viewBox="0 0 16 14"><path d="M8 12.5S1 8 1 4A3 3 0 0 1 8 2 3 3 0 0 1 15 4c0 4-7 8.5-7 8.5z" fill={fav?"#E05C70":"none"} stroke={fav?"#E05C70":"white"} strokeWidth="1.5"/></svg>
          </button>
          <button style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,.88)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 2l9 9M11 2L2 11" stroke="#333" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
          </button>
        </div>
        <div style={{padding:"18px 20px 26px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <p style={{fontSize:11,color:"#C4885A",fontWeight:600,letterSpacing:".08em",marginBottom:3,cursor:"pointer"}} onClick={()=>{onClose();onBrand(p.brand);}}>
                {p.brand} <span style={{fontSize:10,color:"#B0A098",fontWeight:400}}>{t.brandLink}</span>
              </p>
              <h2 style={{fontSize:18,fontWeight:500,color:"#1C1815",lineHeight:1.3}}>{p.name}</h2>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
              <p style={{fontSize:19,fontWeight:600,color:"#1C1815"}}>{formatPrice(displayPrice,displayCur)}</p>
              {displayCur!=="JPY"&&displayJpy&&<p style={{fontSize:11,color:"#C4885A",marginTop:1}}>≈ ¥{Number(displayJpy).toLocaleString()}</p>}
              <p style={{fontSize:11,color:"#8B7B72",marginTop:2}}>{displayVol}</p>
            </div>
          </div>
          {variants&&variants.length>1&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {variants.map((v,i)=>(
                <span key={i} onClick={()=>changeVariant(i)} style={{display:"inline-flex",flexDirection:"column",alignItems:"center",padding:"5px 12px",borderRadius:10,fontSize:11,cursor:"pointer",border:`1px solid ${selVariant===i?"#C4885A":"#E5DDD5"}`,background:selVariant===i?"#FDF5EF":"#FAF7F3",color:selVariant===i?"#C4885A":"#6B5E55",transition:"all .15s",userSelect:"none"}}>
                  <span style={{fontWeight:600}}>{v.volume}</span>
                  {v.price&&<span style={{fontSize:10,marginTop:1}}>{formatPrice(v.price,v.currency||"JPY")}</span>}
                </span>
              ))}
            </div>
          )}
          {allImgs.length>1&&(
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:2}}>
              {allImgs.map((url,i)=>(
                <img key={i} src={url} alt="" onClick={()=>setSelImage(i)}
                  style={{width:54,height:54,objectFit:"contain",borderRadius:6,background:"#F8F8F8",padding:"3px",flexShrink:0,cursor:"pointer",border:`2px solid ${i===selImage?"#C4885A":"#E5DDD5"}`,transition:"border-color .15s"}}/>
              ))}
            </div>
          )}
          <div style={{marginBottom:12}}><StarRating productId={p.id} currentRating={p.rating}/></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
            {[...p.tags,...p.scenes].map(tag=>(<span key={tag} style={{background:"#F0EAE3",color:"#8B7B72",fontSize:11,padding:"3px 9px",borderRadius:12}}>{tag}</span>))}
          </div>
          {p.desc&&(
            <div style={{background:"#F8F4F0",borderRadius:8,padding:"12px 14px",marginBottom:13}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#C4885A",marginBottom:7}}>{t.about.toUpperCase()}</p>
              <p style={{fontSize:13,color:"#1C1815",lineHeight:1.9,whiteSpace:"pre-wrap",letterSpacing:".01em"}}>{p.desc}</p>
            </div>
          )}
          {(p.top.length>0||p.mid.length>0||p.base.length>0)&&(
            <div style={{background:"#F4EFE9",borderRadius:10,padding:"13px 15px",marginBottom:12}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".18em",color:"#C4885A",marginBottom:9}}>{t.notes.toUpperCase()}</p>
              {[[t.top,p.top],[t.mid,p.mid],[t.base,p.base]].map(([lbl,notes])=>notes.length>0&&(
                <div key={lbl} style={{display:"flex",gap:12,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#B0A098",minWidth:68,letterSpacing:".05em",paddingTop:2,flexShrink:0}}>{lbl}</span>
                  <span style={{fontSize:13,color:"#3C2820",lineHeight:1.5}}>
                  {notes.map((n,ni)=>(
                    <span key={ni}>
                      {ni>0&&<span style={{color:"#C4B8A0"}}> · </span>}
                      <span style={{cursor:"pointer",borderBottom:"1px dashed #C4885A",color:"#3C2820",transition:"color .12s"}}
                        onClick={()=>{if(onNoteClick) onNoteClick(n);}}
                        onMouseEnter={e=>e.currentTarget.style.color="#C4885A"}
                        onMouseLeave={e=>e.currentTarget.style.color="#3C2820"}>
                        {n}
                      </span>
                    </span>
                  ))}
                </span>
                </div>
              ))}
            </div>
          )}
          {p.effects.length>0&&(
            <div style={{marginBottom:13}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:7}}>{t.effects.toUpperCase()}</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.effects.map(e=>(<span key={e} style={{background:"#EAF0E8",color:"#3D6B48",fontSize:11,padding:"4px 11px",borderRadius:12}}>{e}</span>))}</div>
            </div>
          )}
          {(p.ingr||p.ingr_en||p.ingr_ko||p.ingr_zh)&&(()=>{
            const ingrMap={"日本語":p.ingr,"English":p.ingr_en,"한국어":p.ingr_ko,"中文":p.ingr_zh,"Français":p.ingr_en};
            const ingrText=ingrMap[lang]||p.ingr||p.ingr_en||"";
            return (
              <div style={{background:"#F4EFE9",borderRadius:8,padding:"10px 14px",marginBottom:15}}>
                <button className="ingr-toggle" onClick={()=>setShowIngr(!showIngr)}>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:".12em",color:"#8B7B72"}}>{t.ingr.toUpperCase()}</span>
                  <svg width="9" height="5" viewBox="0 0 9 5" style={{transform:showIngr?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="#8B7B72" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
                  <span style={{fontSize:10,color:"#B0A098"}}>{showIngr?t.ingrHide:t.ingrShow}</span>
                </button>
                {showIngr&&<p style={{fontSize:11,color:"#6B5E55",lineHeight:1.7,marginTop:8}}>{ingrText||"（未登録）"}</p>}
              </div>
            );
          })()}
          <div style={{marginBottom:20}}>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:9}}>{t.buy.toUpperCase()}</p>
            <div className="buy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {shops.filter(s=>s.shop_name).map((s,i)=>(
                s.url
                  ?<a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                    <button className="bbt fill" style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"9px 6px",lineHeight:1.3}}>
                      <span>{t.buyPre}{s.shop_name}{t.buySuf}</span>
                      {s.current_price&&<span style={{fontSize:11,opacity:.85,marginTop:2}}>¥{Number(s.current_price).toLocaleString()}</span>}
                    </button>
                  </a>
                  :<button key={i} className="bbt out disabled" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"9px 6px",lineHeight:1.3}}>
                    <span>{t.buyPre}{s.shop_name}{t.buySuf}</span>
                    {s.current_price&&<span style={{fontSize:11,opacity:.7,marginTop:2}}>¥{Number(s.current_price).toLocaleString()}</span>}
                  </button>
              ))}
            </div>
          </div>
          {recs.length>0&&(
            <div>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:9}}>{t.similar.toUpperCase()}</p>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                {recs.map(r=>(
                  <div key={r.id} style={{flex:"0 0 108px",background:"#fff",border:"1px solid #E5DDD5",borderRadius:10,overflow:"hidden",cursor:"pointer"}} onClick={()=>onSelect(r)}>
                    <div style={{height:62,background:r.image_url?"#fff":r.g,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {r.image_url?<img src={r.image_url} style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}} alt=""/>
                        :<Bottle style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:22,height:36}}/>}
                    </div>
                    <div style={{padding:"6px 8px"}}>
                      <p style={{fontSize:9,color:"#C4885A",fontWeight:600,marginBottom:2}}>{r.brand}</p>
                      <p style={{fontSize:11,color:"#1C1815",lineHeight:1.3}}>{r.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 広告バナー（Google AdSense対応） ────────────────────────
// AdSenseのコードを取得したらslotに貼り替えるだけ
function AdBanner({ slot = "XXXXXXXXXX", style: s = {} }) {
  // AdSense審査が通ったら以下のコメントを外して使用
  // useEffect(()=>{
  //   try { (window.adsbygoogle=window.adsbygoogle||[]).push({}); } catch(e){}
  // },[]);
  // return (
  //   <ins className="adsbygoogle" style={{display:"block",...s}}
  //     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  //     data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>
  // );

  // 審査前のプレースホルダー（本番では外すこと）
  if (import.meta.env.DEV) return null; // 開発中は非表示
  return null;
}

// 広告帯（ランキングページなどに挿入）
function AdStrip() {
  return (
    <div style={{background:"#F8F4F0",border:"1px solid #E5DDD5",borderRadius:8,padding:"8px 16px",marginBottom:14,textAlign:"center",fontSize:11,color:"#B0A098"}}>
      <AdBanner slot="XXXXXXXXXX" style={{minHeight:90}}/>
    </div>
  );
}

// ── ノート詳細モーダル ───────────────────────────────────────
function NoteDetailModal({ noteName, products, onClose, onProduct }) {
  const info = NOTE_INFO[noteName];
  const familyColor = info ? (NOTE_FAMILY_COLOR[info.family]||"#C4885A") : "#C4885A";
  // このノートを使っている商品
  const relatedProds = products.filter(p=>
    [...(p.top||[]),...(p.mid||[]),...(p.base||[])].some(n=>n===noteName)
  ).slice(0,6);

  return (
    <div className="ovl" onClick={onClose}>
      <div className="mbox" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={{background:`linear-gradient(135deg,${familyColor}22,${familyColor}11)`,borderRadius:"16px 16px 0 0",padding:"24px 20px 16px",position:"relative"}}>
          <button style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,.8)",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
            <svg width="11" height="11" viewBox="0 0 13 13"><path d="M2 2l9 9M11 2L2 11" stroke="#333" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:14,background:`${familyColor}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
              {info?.emoji||"🌸"}
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <h2 style={{fontSize:20,fontWeight:500,color:"#1C1815"}}>{noteName}</h2>
                {info?.en&&<span style={{fontSize:12,color:"#8B7B72"}}>{info.en}</span>}
              </div>
              {info?.family&&(
                <span style={{fontSize:11,padding:"2px 10px",borderRadius:10,background:`${familyColor}22`,color:familyColor,fontWeight:600}}>{info.family}系</span>
              )}
            </div>
          </div>
        </div>
        <div style={{padding:"16px 20px 24px"}}>
          {info?.desc ? (
            <p style={{fontSize:13,color:"#3C2820",lineHeight:1.85,marginBottom:relatedProds.length>0?18:0}}>{info.desc}</p>
          ) : (
            <p style={{fontSize:13,color:"#B0A098",marginBottom:relatedProds.length>0?18:0}}>このノートの情報は準備中です。</p>
          )}
          {relatedProds.length>0&&(
            <>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:10}}>このノートを使った商品</p>
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                {relatedProds.map(r=>(
                  <div key={r.id} style={{flex:"0 0 100px",background:"#fff",border:"1px solid #E5DDD5",borderRadius:10,overflow:"hidden",cursor:"pointer"}} onClick={()=>{onProduct(r);onClose();}}>
                    <div style={{height:58,background:r.image_url?"#fff":r.g,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {r.image_url?<img src={r.image_url} style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}} alt=""/>
                        :<div style={{fontSize:22,opacity:.4}}>🌸</div>}
                    </div>
                    <div style={{padding:"5px 7px"}}>
                      <p style={{fontSize:9,color:"#C4885A",fontWeight:600,marginBottom:1}}>{r.brand}</p>
                      <p style={{fontSize:10,color:"#1C1815",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Loading({msg}) {
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:16}}><div className="spin"/><p style={{fontSize:13,color:"#8B7B72"}}>{msg}</p></div>;
}
function ErrorScreen({msg,onRetry}) {
  return <div style={{textAlign:"center",padding:"80px 20px"}}><p style={{fontSize:14,color:"#B03040",marginBottom:12}}>⚠ {msg}</p><button className="cbt" onClick={onRetry}>再試行</button></div>;
}

export default function App() {
  const [langIdx,setLangIdx]=useState(0);
  const lang=LANGS[langIdx];
  const t=T[lang]||T["日本語"];
  const {products,loading,error,refetch}=useProducts(lang);
  const {brandMap}=useBrands();
  const [query,setQuery]=useState("");
  const [selTags,setSelTags]=useState([]);
  const [selCat,setSelCat]=useState("all");
  const [favs,setFavs]=useState(new Set());
  const [favBrands,setFavBrands]=useState(new Set());
  const [sort,setSort]=useState("views");
  const [view,setView]=useState("home");
  const [page,setPage]=useState(1);
  const PER_PAGE = 24;
  const [modal,setModal]=useState(null);
  const [noteModal,setNoteModal]=useState(null);
  const [showLang,setShowLang]=useState(false);
  const [tagOpen,setTagOpen]=useState(false);
  const [brandOpen,setBrandOpen]=useState(false);
  const [brandQ,setBrandQ]=useState("");
  const [brandCountry,setBrandCountry]=useState("");
  const [curBrand,setCurBrand]=useState(null);
  const [brandCat,setBrandCat]=useState("all");
  const [brandTags,setBrandTags]=useState([]);
  const [simQuery,setSimQuery]=useState("");
  const [noteSearchQuery,setNoteSearchQuery]=useState("");
    const [noteSearch,setNoteSearch]=useState("");

  const allBrands=[...new Set(products.map(p=>p.brand))].sort();
  const filtBrands=allBrands.filter(b=>{
    if(brandQ&&!b.toLowerCase().includes(brandQ.toLowerCase())) return false;
    if(brandCountry&&brandMap[b]?.country!==brandCountry) return false;
    return true;
  });
  const openBrand=b=>{setCurBrand(b);setBrandCat("all");setBrandTags([]);setView("brand");setBrandOpen(false);};
  const toggleFav=id=>setFavs(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleFavBrand=name=>setFavBrands(prev=>{const n=new Set(prev);n.has(name)?n.delete(name):n.add(name);return n;});
  const toggleTag=tag=>{setSelTags(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]);setView("search");setPage(1);};
  const toggleBTag=tag=>setBrandTags(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]);
  const openModal=p=>{setModal(p);trackView(p.id);};

  const sorted=[...products].sort((a,b)=>{
    if(sort==="views") return b.views-a.views; if(sort==="favs") return b.favs-a.favs;
    if(sort==="price_asc") return a.price-b.price; if(sort==="price_desc") return b.price-a.price;
    return b.rating-a.rating;
  });
  const filtered=sorted.filter(p=>{
    if(selCat!=="all"&&p.type!==selCat) return false;
    if(query){const q=query.toLowerCase();if(!p.name.includes(q)&&!p.brand.toLowerCase().includes(q)&&![...p.tags,...p.scenes].some(t2=>t2.includes(q)))return false;}
    if(selTags.length>0&&!selTags.some(t2=>p.tags.includes(t2)||p.scenes.includes(t2)))return false;
    return true;
  });
  const allDisplay=view==="favorites"?sorted.filter(p=>favs.has(p.id)):filtered;
  const totalPages=Math.max(1,Math.ceil(allDisplay.length/PER_PAGE));
  const display=view==="favorites"?allDisplay:allDisplay.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const brandProds=curBrand?sorted.filter(p=>{
    if(p.brand!==curBrand) return false;
    if(brandCat!=="all"&&p.type!==brandCat) return false;
    if(brandTags.length>0&&!brandTags.some(t2=>p.tags.includes(t2)||p.scenes.includes(t2)))return false;
    return true;
  }):[];
  const brandItems=curBrand?[...new Set(products.filter(p=>p.brand===curBrand).map(p=>p.type))]:[];
  const brandTagList=curBrand?[...new Set(products.filter(p=>p.brand===curBrand).flatMap(p=>[...p.tags,...p.scenes]))]:[];
  const recs=modal?getSimilarProducts(modal,products,4):[];

  return (
    <>
      <style>{CSS}</style>
      <div style={{fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP','Helvetica Neue',sans-serif",background:"#FAF7F3",minHeight:"100vh",color:"#1C1815"}}>
        <header style={{background:"#fff",borderBottom:"1px solid #E5DDD5",position:"sticky",top:0,zIndex:50}}>
          <div className="sp-header" style={{maxWidth:1100,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
            <div className="lf" onClick={()=>{setView("home");setQuery("");setSelTags([]);setSelCat("all");setBrandQ("");}} style={{cursor:"pointer"}}>
              <span className="sp-logo" style={{fontSize:21,fontWeight:400}}><span style={{color:"#C4885A"}}>Kaorido</span></span>
              <span className="sp-hide" style={{display:"block",fontSize:9,letterSpacing:".32em",color:"#B0A098",marginTop:-3}}>FRAGRANCE GUIDE</span>
            </div>
            {/* PC用ナビ（スマホでは非表示→下部固定に） */}
            <nav className="sp-hide" style={{display:"flex",gap:18,alignItems:"center"}}>
              {[["home",t.home],["ranking",t.ranking],["similar",t.simTitle],["notes","香りで探す"],["favorites",`${t.favNav}${(favs.size+favBrands.size)>0?` (${favs.size+favBrands.size})`:""}`]].map(([id,lbl])=>(
                <span key={id} className={`nvb${view===id?" on":""}`} style={{color:view===id?"#C4885A":"#6B5E55"}} onClick={()=>setView(id)}>{lbl}</span>
              ))}
            </nav>
            <div style={{position:"relative"}}>
              <button style={{background:"none",border:"1px solid #E5DDD5",borderRadius:6,padding:"4px 11px",fontSize:12,color:"#6B5E55",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}} onClick={()=>setShowLang(!showLang)}>
                {lang}<svg width="8" height="5" viewBox="0 0 8 5"><path d="M0.5 0.5L4 4L7.5 0.5" stroke="#8B7B72" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
              </button>
              {showLang&&<div className="ldd">{LANGS.map((l,i)=>(<div key={i} className="ldi" onClick={()=>{setLangIdx(i);setShowLang(false);}}>{l}</div>))}</div>}
            </div>
          </div>
          {/* スマホ用ボトムナビ */}
          <nav className="sp-nav" style={{display:"none"}}>
            {[
              ["home",t.home,"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
              ["ranking",t.ranking,"M18 20V10M12 20V4M6 20v-6"],
              ["note-search","香りから","M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"],
              ["similar",t.simTitle,"M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"],
              ["favorites",t.favNav,"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"],
            ].map(([id,lbl,path])=>(
              <span key={id} className={`nvb${view===id?" on":""}`} style={{color:view===id?"#C4885A":"#9A8A82",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:9,padding:"4px 10px",cursor:"pointer"}} onClick={()=>setView(id)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
                {id==="favorites"&&(favs.size+favBrands.size)>0?`${lbl}(${favs.size+favBrands.size})`:lbl}
              </span>
            ))}
          </nav>
        </header>

        <main className="sp-p" style={{maxWidth:1100,margin:"0 auto",padding:"20px 20px 64px"}}>
          {/* 検索エリア */}
          <div style={{marginBottom:20}}>
            <div className="si" style={{position:"relative",marginBottom:10}}>
              <svg style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)"}} width="16" height="16" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#9A8A82" strokeWidth="1.4"/><path d="M11 11l4 4" stroke="#9A8A82" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <input placeholder={t.searchPh} value={query} onChange={e=>{setQuery(e.target.value);setView(e.target.value?"search":"home");setPage(1);}}/>
            </div>
            <div className="sp-cats" style={{display:"flex",gap:6,flexWrap:"nowrap",overflowX:"auto",marginBottom:10,paddingBottom:4,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
              {CATS.map(c=>(<button key={c.id} className={`cbt${selCat===c.id?" on":""}`} style={{flexShrink:0}} onClick={()=>{setSelCat(c.id);setView(query?"search":"home");setPage(1);}}>{c.l}</button>))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                <button className={`tog-btn${tagOpen?" active":""}`} onClick={()=>setTagOpen(!tagOpen)}>
                  <svg width="13" height="11" viewBox="0 0 13 11" fill="none"><rect x="1" y="1" width="11" height="1.8" rx="0.9" fill="currentColor"/><rect x="3" y="4.6" width="7" height="1.8" rx="0.9" fill="currentColor"/><rect x="5" y="8.2" width="3" height="1.8" rx="0.9" fill="currentColor"/></svg>
                  {t.tagBtn}{selTags.length>0&&` (${selTags.length}${t.selected})`}
                  <svg width="8" height="5" viewBox="0 0 8 5" style={{transform:tagOpen?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M0.5 0.5L4 4L7.5 0.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
                </button>
                {selTags.map(tag=>(<span key={tag} className="tpill" style={{background:"#C4885A",color:"#fff"}} onClick={()=>toggleTag(tag)}>{tag} ×</span>))}
                {selTags.length>0&&<span style={{fontSize:11,color:"#C4885A",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setSelTags([])}>{t.clearAll}</span>}
              </div>
              {tagOpen&&<TagPanel groups={TAG_GROUPS} selected={selTags} onToggle={toggleTag}/>}
            </div>
            <div>
              <button className={`tog-btn${brandOpen?" active":""}`} onClick={()=>setBrandOpen(!brandOpen)}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4 6.5h5M6.5 4v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {t.brandBtn}{curBrand&&view==="brand"&&` (${curBrand})`}
                <svg width="8" height="5" viewBox="0 0 8 5" style={{transform:brandOpen?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M0.5 0.5L4 4L7.5 0.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
              </button>
              {brandOpen&&(
                <div style={{background:"#fff",border:"1px solid #E5DDD5",borderRadius:10,padding:"14px 16px",marginTop:8}}>
                  <div className="si sm" style={{position:"relative",marginBottom:10}}>
                    <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#9A8A82" strokeWidth="1.4"/><path d="M11 11l4 4" stroke="#9A8A82" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    <input placeholder={t.brandPh} value={brandQ} onChange={e=>setBrandQ(e.target.value)}/>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${!brandCountry?"#C4885A":"#E5DDD5"}`,background:!brandCountry?"#C4885A":"#FAF7F3",color:!brandCountry?"#fff":"#6B5E55",transition:"all .15s",userSelect:"none"}} onClick={()=>setBrandCountry("")}>すべて</span>
                    {COUNTRY_LIST.map(c=>(<span key={c.code} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${brandCountry===c.code?"#C4885A":"#E5DDD5"}`,background:brandCountry===c.code?"#C4885A":"#FAF7F3",color:brandCountry===c.code?"#fff":"#6B5E55",transition:"all .15s",userSelect:"none"}} onClick={()=>setBrandCountry(brandCountry===c.code?"":c.code)}><span style={{fontSize:14}}>{c.flag}</span>{c.name}</span>))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(118px,1fr))",gap:8}}>
                    {filtBrands.map(b=>(<BrandCard key={b} brand={b} dbInfo={brandMap[b]} isOn={curBrand===b&&view==="brand"} onClick={()=>openBrand(b)} favBrands={favBrands} onFavBrand={toggleFavBrand}/>))}
                    {filtBrands.length===0&&<p style={{fontSize:12,color:"#B0A098",gridColumn:"1/-1"}}>該当なし</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading&&<Loading msg={t.loading}/>}
          {!loading&&error&&<ErrorScreen msg={t.error} onRetry={refetch}/>}

          {/* ── ブランドページ ── */}
          {!loading&&!error&&view==="brand"&&curBrand&&(()=>{
            const bInfo=brandMap[curBrand];
            const g=bInfo?.color_from&&bInfo?.color_to?`linear-gradient(145deg,${bInfo.color_from},${bInfo.color_to})`:"linear-gradient(135deg,#F5ECE0,#EDE0D4)";
            const flag=COUNTRY_LIST.find(c=>c.code===bInfo?.country)?.flag||"";
            return (
              <>
                {/* ブランドヘッダー */}
                <div style={{borderRadius:14,overflow:"hidden",marginBottom:20,background:"#fff",border:"1px solid #E5DDD5"}}>
                  {/* ブランドカラーのアクセントバー */}
                  <div style={{height:6,background:g}}/>
                  <div style={{padding:"24px 28px",display:"flex",alignItems:"center",gap:20}}>
                    <div style={{width:80,height:80,borderRadius:12,background:"rgba(255,255,255,.75)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                      {bInfo?.logo_url
                        ?<img src={bInfo.logo_url} style={{width:"100%",height:"100%",objectFit:"contain",padding:8}} alt={curBrand}/>
                        :<span style={{fontFamily:"Georgia,serif",fontSize:bInfo?.abbr?.length>5?11:bInfo?.abbr?.length>3?14:20,color:bInfo?.logo_color||"#3A3A3A",letterSpacing:".1em"}}>{bInfo?.abbr||curBrand.slice(0,3)}</span>
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <h2 style={{fontSize:22,fontWeight:400,color:"#1C1815",fontFamily:"Georgia,serif"}}>{curBrand}</h2>
                        {flag&&<span style={{fontSize:20}}>{flag}</span>}
                        <button className="fav-btn" style={{width:32,height:32,background:"rgba(255,255,255,.8)",marginLeft:4}} onClick={()=>toggleFavBrand(curBrand)}>
                          <svg width="14" height="13" viewBox="0 0 16 14"><path d="M8 12.5S1 8 1 4A3 3 0 0 1 8 2 3 3 0 0 1 15 4c0 4-7 8.5-7 8.5z" fill={favBrands.has(curBrand)?"#E05C70":"none"} stroke={favBrands.has(curBrand)?"#E05C70":"#888"} strokeWidth="1.5"/></svg>
                        </button>
                      </div>
                      {bInfo?.description_ja&&<p style={{fontSize:13,color:"#3C2820",lineHeight:1.8,marginBottom:10}}>{bInfo.description_ja}</p>}
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        {bInfo?.official_url&&(
                          <a href={bInfo.official_url} target="_blank" rel="noopener noreferrer" className="official-btn">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 5.5h4M5.5 3.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            公式サイト
                          </a>
                        )}
                        <span style={{fontSize:12,color:"#8B7B72"}}>{products.filter(p=>p.brand===curBrand).length}{t.items}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <button className="back-btn" onClick={()=>{setView("home");setCurBrand(null);}}>
                    <svg width="12" height="10" viewBox="0 0 12 10"><path d="M5 1L1 5l4 4M1 5h10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t.back}
                  </button>
                </div>

                {/* ── 香りの種類・紹介セクション ── */}
                {(bInfo?.scent_intro||(bInfo?.scent_types?.length>0))&&(
                  <div style={{background:"#fff",border:"1px solid #E5DDD5",borderRadius:12,padding:"18px 20px",marginBottom:18}}>
                    <p style={{fontSize:11,fontWeight:700,letterSpacing:".15em",color:"#C4885A",marginBottom:10}}>この香りの特徴</p>
                    {bInfo?.scent_intro&&(
                      <p style={{fontSize:13,color:"#3C2820",lineHeight:1.85,marginBottom:bInfo?.scent_types?.length>0?14:0,whiteSpace:"pre-wrap"}}>{bInfo.scent_intro}</p>
                    )}
                    {bInfo?.scent_types?.length>0&&(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                        {bInfo.scent_types.map((st,i)=>(
                          <div key={i} style={{background:"#FAF7F3",borderRadius:9,padding:"12px 14px",border:"1px solid #EDE5DA"}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                              <span style={{width:6,height:6,borderRadius:"50%",background:"#C4885A",display:"inline-block",flexShrink:0}}/>
                              <p style={{fontSize:12,fontWeight:700,color:"#1C1815"}}>{st.name}</p>
                            </div>
                            <p style={{fontSize:12,color:"#6B5E55",lineHeight:1.75}}>{st.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:9}}>
                  <button className={`cbt${brandCat==="all"?" on":""}`} onClick={()=>setBrandCat("all")}>すべて</button>
                  {brandItems.map(c=>(<button key={c} className={`cbt${brandCat===c?" on":""}`} onClick={()=>setBrandCat(c)}>{c}</button>))}
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
                  {brandTagList.map(tag=>(<span key={tag} className="tpill" style={{background:brandTags.includes(tag)?"#C4885A":"#F0EAE3",color:brandTags.includes(tag)?"#fff":"#8B7B72"}} onClick={()=>toggleBTag(tag)}>{tag}</span>))}
                </div>
                <div className="sp-grid2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                  {brandProds.map(p=>(<Card key={p.id} p={p} rank={null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
                </div>
                {brandProds.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:"#B0A098"}}><p>{t.noResult}</p></div>}
              </>
            );
          })()}

          {/* ── 通常ビュー ── */}
          {!loading&&!error&&view!=="brand"&&(
            <>
              {/* ホームヒーロー */}
              {view==="home"&&!query&&selTags.length===0&&(
                <div className="sp-hero" style={{background:"linear-gradient(135deg,#F5ECE0,#EDE0D4)",borderRadius:14,padding:"22px 32px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,overflow:"hidden",flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:16,flex:1,minWidth:0}}>
                    <div className="sp-hero-sym" style={{fontSize:44,opacity:.18,fontFamily:"Georgia,serif",lineHeight:1,color:"#C4885A",flexShrink:0}}>◈</div>
                    <div>
                      <p style={{fontSize:9,letterSpacing:".35em",color:"#C4885A",marginBottom:5}}>FIND YOUR SIGNATURE SCENT</p>
                      <h1 className="lf sp-hero-h1" style={{fontSize:22,fontWeight:400,lineHeight:1.3,color:"#1C1815",whiteSpace:"nowrap"}}>あなただけの香りを見つけましょう</h1>
                    </div>
                  </div>
                  <p className="sp-hero-sub" style={{fontSize:12,color:"#8B7B72",lineHeight:1.7,flexShrink:0,textAlign:"right"}}>
                    香り・シーン・アイテムから<br/>最適な一本を提案します
                  </p>
                </div>
              )}

              {/* 類似検索ページ */}
              {/* 香りで探す（ノート検索） */}
              {view==="notes"&&(
                <div style={{marginBottom:20}}>
                  <p style={{fontSize:14,fontWeight:500,color:"#1C1815",marginBottom:6}}>香りで探す</p>
                  <p style={{fontSize:13,color:"#6B5E55",marginBottom:14,lineHeight:1.7}}>ノート（原料・素材）の名前から商品を探せます。クリックすると詳細も見られます。</p>
                  <div className="si" style={{position:"relative",marginBottom:16}}>
                    <svg style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)"}} width="16" height="16" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#9A8A82" strokeWidth="1.4"/><path d="M11 11l4 4" stroke="#9A8A82" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    <input placeholder="例: ベルガモット、ローズ、ムスク..." value={noteSearch} onChange={e=>setNoteSearch(e.target.value)}/>
                  </div>
                  {/* 登録済みのノート一覧 */}
                  {!noteSearch&&(()=>{
                    const allNotes=[...new Set(products.flatMap(p=>[...p.top,...p.mid,...p.base]).filter(Boolean))].sort();
                    if(!allNotes.length) return <p style={{fontSize:12,color:"#B0A098",textAlign:"center",padding:"20px 0"}}>商品を登録するとノートが表示されます</p>;
                    return (
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {allNotes.map(n=>(
                          <span key={n} onClick={()=>setNoteModal(n)}
                            style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:"1px solid #E5DDD5",background:"#FAF7F3",color:"#6B5E55",transition:"all .15s",userSelect:"none"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="#C4885A";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#C4885A";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="#FAF7F3";e.currentTarget.style.color="#6B5E55";e.currentTarget.style.borderColor="#E5DDD5";}}>
                            <span style={{fontSize:13}}>{NOTE_INFO[n]?.emoji||"🌿"}</span>{n}
                            <span style={{fontSize:10,background:"rgba(0,0,0,.07)",borderRadius:10,padding:"0 5px"}}>{products.filter(p=>[...p.top,...p.mid,...p.base].includes(n)).length}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  {/* ノート検索結果 */}
                  {noteSearch&&(()=>{
                    const q=noteSearch.toLowerCase();
                    const matchedNotes=[...new Set(products.flatMap(p=>[...p.top,...p.mid,...p.base]).filter(Boolean))].filter(n=>n.toLowerCase().includes(q));
                    const matchedProds=products.filter(p=>[...p.top,...p.mid,...p.base].some(n=>n.toLowerCase().includes(q)));
                    return (
                      <>
                        {matchedNotes.length>0&&(
                          <div style={{marginBottom:16}}>
                            <p style={{fontSize:11,color:"#8B7B72",marginBottom:8}}>ノート名</p>
                            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                              {matchedNotes.map(n=>(
                                <span key={n} onClick={()=>setNoteModal(n)}
                                  style={{padding:"5px 14px",borderRadius:20,fontSize:12,cursor:"pointer",background:"#C4885A",color:"#fff",userSelect:"none"}}>
                                  {NOTE_INFO[n]?.emoji||"🌿"} {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p style={{fontSize:11,color:"#8B7B72",marginBottom:10}}>{matchedProds.length}件の商品</p>
                        <div className="sp-grid2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                          {matchedProds.map(p=>(<Card key={p.id} p={p} rank={null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
                        </div>
                        {matchedProds.length===0&&<p style={{fontSize:13,color:"#B0A098",textAlign:"center",padding:"40px 0"}}>「{noteSearch}」を含む商品が見つかりません</p>}
                      </>
                    );
                  })()}
                </div>
              )}

              {view==="similar"&&(
                <div style={{marginBottom:20}}>
                  <p style={{fontSize:14,fontWeight:500,color:"#1C1815",marginBottom:6}}>{t.simTitle}</p>
                  <p style={{fontSize:13,color:"#6B5E55",marginBottom:14,lineHeight:1.7}}>商品名・ブランド・タグを入力すると、似ている香りを自動で探します。</p>
                  <div className="si" style={{position:"relative",marginBottom:16}}>
                    <svg style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)"}} width="16" height="16" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#9A8A82" strokeWidth="1.4"/><path d="M11 11l4 4" stroke="#9A8A82" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    <input placeholder={t.simPh} value={simQuery} onChange={e=>setSimQuery(e.target.value)}/>
                  </div>
                  {simQuery&&(()=>{
                    const q=simQuery.toLowerCase();
                    const base=products.find(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||[...p.tags,...p.scenes].some(t2=>t2.includes(q)));
                    if(!base) return <p style={{fontSize:13,color:"#B0A098",textAlign:"center",padding:"40px 0"}}>「{simQuery}」に一致する商品が見つかりません</p>;
                    const simProds=getSimilarProducts(base,products);
                    return (
                      <>
                        <div style={{background:"#F4EFE9",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>openModal(base)}>
                          <div style={{width:52,height:52,borderRadius:8,background:base.image_url?"#fff":base.g,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {base.image_url?<img src={base.image_url} style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}} alt=""/>:<Bottle style={{width:24,height:38}}/>}
                          </div>
                          <div style={{flex:1}}>
                            <p style={{fontSize:10,color:"#C4885A",fontWeight:600,marginBottom:2}}>{base.brand}</p>
                            <p style={{fontSize:13,fontWeight:500,color:"#1C1815"}}>{base.name}</p>
                            <p style={{fontSize:11,color:"#8B7B72",marginTop:3}}>この商品に似た {simProds.length} 件を表示中</p>
                          </div>
                        </div>
                        <div className="sp-grid2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                          {simProds.map(p=>(<Card key={p.id} p={p} rank={null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
                        </div>
                        {simProds.length===0&&<p style={{fontSize:13,color:"#B0A098",textAlign:"center",padding:"40px 0"}}>類似商品が見つかりませんでした</p>}
                      </>
                    );
                  })()}
                </div>
              )}

              {view!=="similar"&&view!=="note-search"&&(
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{fontSize:13,color:"#8B7B72"}}>
                      {view==="favorites"&&`${t.favNav}（${display.length}${t.items}）`}
                      {view==="ranking"&&t.ranking}
                      {(view==="home"||view==="search")&&`${allDisplay.length}${t.items}`}
                    </span>
                    <select className="ssel" value={sort} onChange={e=>setSort(e.target.value)}>
                      {SORTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  {view==="ranking"&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{SORTS.map(o=>(<button key={o.v} className={`cbt${sort===o.v?" on":""}`} onClick={()=>setSort(o.v)}>{o.l}</button>))}</div>}
                  {view==="favorites"&&favs.size===0&&favBrands.size===0&&(
                    <div style={{textAlign:"center",padding:"60px 20px",color:"#8B7B72"}}>
                      <svg width="44" height="40" viewBox="0 0 44 40" style={{marginBottom:14,opacity:.22}}><path d="M22 36S2 24 2 11A9 9 0 0 1 22 6 9 9 0 0 1 42 11C42 24 22 36 22 36z" stroke="#8B7B72" strokeWidth="2" fill="none"/></svg>
                      <p style={{fontSize:14,marginBottom:6}}>{t.noFav}</p>
                      <p style={{fontSize:12,color:"#B0A098"}}>{t.noFavSub}</p>
                    </div>
                  )}
                  {!(view==="favorites"&&favs.size===0&&favBrands.size===0)&&(
                    <>
                      {view==="favorites"&&favBrands.size>0&&(
                        <div style={{marginBottom:24}}>
                          <p style={{fontSize:11,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:10}}>お気に入りブランド</p>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(118px,1fr))",gap:8}}>
                            {[...favBrands].map(b=>(<BrandCard key={b} brand={b} dbInfo={brandMap[b]} isOn={curBrand===b&&view==="brand"} onClick={()=>openBrand(b)} favBrands={favBrands} onFavBrand={toggleFavBrand}/>))}
                          </div>
                        </div>
                      )}
                      {(view!=="favorites"||favs.size>0)&&(
                        <>
                          {view==="favorites"&&favBrands.size>0&&favs.size>0&&<p style={{fontSize:11,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:10}}>お気に入り商品</p>}
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                            {display.map((p,i)=>(<Card key={p.id} p={p} rank={view==="home"||view==="ranking"?i:null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>
        {modal&&<Modal p={modal} fav={favs.has(modal.id)} onFav={toggleFav} recs={recs} lang={lang} onClose={()=>setModal(null)} onSelect={p=>setModal(p)} onBrand={openBrand} onNoteClick={setNoteModal}/>}
        {noteModal&&<NoteDetailModal noteName={noteModal} products={products} onClose={()=>setNoteModal(null)} onProduct={p=>{setModal(p);trackView(p.id);}}/>}
      </div>
    </>
  );
}
