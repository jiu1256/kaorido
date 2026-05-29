// src/App.jsx
// Supabase対応版 — リアルデータで動くアプリ本体
// デモ版との変更点:
//   ① PRODUCTS定数 → useProducts()フックに置き換え
//   ② ブランドカードの色情報 → DBから取得（ローカル定数はフォールバック）
//   ③ 購入リンク → DBのbuy_linksテーブルから取得・実URLを使用
//   ④ ローディング・エラー状態を追加

import { useState } from "react";
import { useProducts, useBrands, trackView } from "./hooks/useProducts";

// ── ローカル定数（DBに登録するまでのフォールバック用） ───────────────
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
  "Dior":            { g:"linear-gradient(145deg,#F8E6EC,#EDD0D8)", logo:"#8A2040", abbr:"Dior" },
  "Acqua di Parma":  { g:"linear-gradient(145deg,#FDEEC0,#F5D878)", logo:"#7A5010", abbr:"AdP" },
  "YSL":             { g:"linear-gradient(145deg,#1E1C1C,#2C2828)", logo:"#D4A820", abbr:"YSL" },
  "CHANEL":          { g:"linear-gradient(145deg,#1A1818,#2A2828)", logo:"#E8E0D8", abbr:"CHANEL" },
  "Jo Malone":       { g:"linear-gradient(145deg,#F5EDE0,#E8D8C4)", logo:"#4A3020", abbr:"JM" },
  "KUUMBA":          { g:"linear-gradient(145deg,#C8E8D8,#90C8B0)", logo:"#1A4030", abbr:"K" },
  "Elizabeth Arden": { g:"linear-gradient(145deg,#F0C8D8,#D898B8)", logo:"#681840", abbr:"EA" },
  "SABON":           { g:"linear-gradient(145deg,#C8D0E8,#9098C8)", logo:"#202068", abbr:"SABON" },
  "JURLIQUE":        { g:"linear-gradient(145deg,#D4E8C0,#A8D090)", logo:"#284820", abbr:"JUR" },
  "L'OCCITANE":      { g:"linear-gradient(145deg,#DCD0E8,#B890C8)", logo:"#401860", abbr:"L'O" },
  "MARKS & WEB":     { g:"linear-gradient(145deg,#EAE8E0,#D8D4C8)", logo:"#2A2A20", abbr:"M&W" },
};
const B_DEF = { g:"linear-gradient(145deg,#E8E4E0,#D4D0CC)", logo:"#3A3A3A", abbr:"◈" };
const CUR_SYM = { JPY:"¥", USD:"$", EUR:"€", GBP:"£", KRW:"₩", CNY:"¥", CAD:"CA$", AUD:"A$", SEK:"kr", CHF:"CHF" };
function formatPrice(price, currency) {
  if (!price) return "—";
  const sym = CUR_SYM[currency] || "";
  const num = Number(price).toLocaleString();
  return sym === "¥" || sym === "₩" ? sym + num : sym + num;
}
const COUNTRY_LIST = [
  { code:"JP", flag:"🇯🇵", name:"日本" },
  { code:"KR", flag:"🇰🇷", name:"韓国" },
  { code:"CN", flag:"🇨🇳", name:"中国" },
  { code:"US", flag:"🇺🇸", name:"アメリカ" },
  { code:"FR", flag:"🇫🇷", name:"フランス" },
  { code:"GB", flag:"🇬🇧", name:"イギリス" },
  { code:"IT", flag:"🇮🇹", name:"イタリア" },
  { code:"DE", flag:"🇩🇪", name:"ドイツ" },
  { code:"ES", flag:"🇪🇸", name:"スペイン" },
  { code:"SE", flag:"🇸🇪", name:"スウェーデン" },
  { code:"NL", flag:"🇳🇱", name:"オランダ" },
  { code:"AU", flag:"🇦🇺", name:"オーストラリア" },
  { code:"CA", flag:"🇨🇦", name:"カナダ" },
  { code:"OTHER", flag:"🌍", name:"その他" },
];
const SORTS = [
  {v:"views",l:"閲覧数順"},{v:"favs",l:"お気に入り順"},
  {v:"price_asc",l:"安い順"},{v:"price_desc",l:"高い順"},{v:"rating",l:"評価順"},
];
const LANGS = ["日本語","English","한국어","中文","Français"];
const T = {
  "日本語": { about:"紹介", notes:"フレグランスノート", top:"トップ", mid:"ミドル", base:"ベース", effects:"効果・効能", ingr:"成分・詳細", ingrShow:"表示する（公式サイト記載）", ingrHide:"折りたたむ", buy:"購入先", buyPre:"", buySuf:" で見る", similar:"似ている香り", brandLink:"→ ブランドページ", home:"ホーム", ranking:"ランキング", favNav:"お気に入り", searchPh:"香水名・ブランド・#フローラルなどで検索...", tagBtn:"タグで探す", brandBtn:"ブランドから探す", brandPh:"ブランド名を入力...", back:"戻る", items:"件", noFav:"お気に入りはまだありません", noFavSub:"カードの ♡ ボタンで登録できます", noResult:"条件に合う商品が見つかりませんでした", selected:"件選択中", clearAll:"すべて解除", loading:"読み込み中...", error:"データの取得に失敗しました" },
  "English": { about:"About", notes:"Fragrance Notes", top:"Top", mid:"Middle", base:"Base", effects:"Effects & Benefits", ingr:"Ingredients", ingrShow:"Show (from official site)", ingrHide:"Hide", buy:"Where to Buy", buyPre:"View on ", buySuf:"", similar:"Similar Fragrances", brandLink:"→ Brand Page", home:"Home", ranking:"Rankings", favNav:"Favorites", searchPh:"Search by name, brand, #floral...", tagBtn:"Filter by Tags", brandBtn:"Browse Brands", brandPh:"Search brand name...", back:"Back", items:" results", noFav:"No favorites yet", noFavSub:"Tap ♡ on any product card", noResult:"No products found", selected:" selected", clearAll:"Clear all", loading:"Loading...", error:"Failed to load data" },
  "한국어": { about:"소개", notes:"프래그런스 노트", top:"탑 노트", mid:"미들 노트", base:"베이스 노트", effects:"효능", ingr:"성분 · 상세", ingrShow:"표시하기", ingrHide:"접기", buy:"구매처", buyPre:"", buySuf:"에서 보기", similar:"비슷한 향기", brandLink:"→ 브랜드 페이지", home:"홈", ranking:"랭킹", favNav:"즐겨찾기", searchPh:"향수명·브랜드·#플로럴로 검색...", tagBtn:"태그로 찾기", brandBtn:"브랜드로 찾기", brandPh:"브랜드 이름...", back:"돌아가기", items:"개", noFav:"즐겨찾기가 없습니다", noFavSub:"카드의 ♡ 버튼으로 등록", noResult:"검색 결과 없음", selected:"개 선택", clearAll:"모두 해제", loading:"로딩 중...", error:"데이터 로딩 실패" },
  "中文": { about:"产品介绍", notes:"香调", top:"前调", mid:"中调", base:"后调", effects:"功效与益处", ingr:"成分 · 详情", ingrShow:"显示", ingrHide:"收起", buy:"购买途径", buyPre:"在", buySuf:"查看", similar:"相似香水", brandLink:"→ 品牌页面", home:"首页", ranking:"排行榜", favNav:"收藏", searchPh:"搜索香水名、品牌、#花香...", tagBtn:"按标签筛选", brandBtn:"按品牌浏览", brandPh:"输入品牌名称...", back:"返回", items:"件", noFav:"暂无收藏", noFavSub:"点击 ♡ 进行收藏", noResult:"未找到相关商品", selected:"项已选", clearAll:"清除全部", loading:"加载中...", error:"数据加载失败" },
  "Français": { about:"Présentation", notes:"Notes de Parfum", top:"Note de tête", mid:"Note de cœur", base:"Note de fond", effects:"Bienfaits", ingr:"Ingrédients", ingrShow:"Afficher", ingrHide:"Réduire", buy:"Où Acheter", buyPre:"Voir sur ", buySuf:"", similar:"Parfums Similaires", brandLink:"→ Page Marque", home:"Accueil", ranking:"Classement", favNav:"Favoris", searchPh:"Rechercher nom, marque, #floral...", tagBtn:"Filtrer par tags", brandBtn:"Parcourir les marques", brandPh:"Rechercher une marque...", back:"Retour", items:" résultats", noFav:"Aucun favori", noFavSub:"Appuyez sur ♡ sur une carte", noResult:"Aucun produit trouvé", selected:" sélectionné(s)", clearAll:"Tout effacer", loading:"Chargement...", error:"Erreur de chargement" },
};

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
.lf{font-family:Georgia,'Times New Roman',serif;}
.card{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5DDD5;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease;}
.card:hover{transform:translateY(-5px);box-shadow:0 18px 44px rgba(50,25,8,.13);}
.fav-btn{background:rgba(255,255,255,.88);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;}
.fav-btn:hover{transform:scale(1.2);}
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
.rbdg{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;z-index:2;}
.tag-panel{background:#fff;border:1px solid #E5DDD5;border-radius:10px;padding:14px 16px;margin-top:8px;}
.tog-btn{display:flex;align-items:center;gap:7px;background:none;border:1px solid #E5DDD5;border-radius:20px;padding:5px 14px;font-size:12px;color:#6B5E55;cursor:pointer;font-family:inherit;transition:all .15s;}
.tog-btn:hover{border-color:#C4885A;color:#C4885A;}.tog-btn.active{background:#C4885A;color:#fff;border-color:#C4885A;}
.ingr-toggle{display:flex;align-items:center;gap:6px;background:none;border:none;font-size:11px;color:#8B7B72;cursor:pointer;font-family:inherit;padding:0;}.ingr-toggle:hover{color:#C4885A;}
.back-btn{display:flex;align-items:center;gap:6px;background:none;border:1px solid #E5DDD5;border-radius:20px;padding:5px 14px;font-size:12px;color:#6B5E55;cursor:pointer;font-family:inherit;transition:all .15s;}.back-btn:hover{border-color:#C4885A;color:#C4885A;}
.brand-card{background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E5DDD5;cursor:pointer;transition:all .18s;}
.brand-card:hover{box-shadow:0 6px 18px rgba(50,25,8,.12);transform:translateY(-3px);}
.brand-card.on{border-color:#C4885A;box-shadow:0 0 0 2px #C4885A40;}
.spin{display:inline-block;width:28px;height:28px;border:3px solid #E5DDD5;border-top-color:#C4885A;border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ── HELPERS ────────────────────────────────────────────────────────────
function Stars({ n }) {
  return (
    <span style={{display:"flex",alignItems:"center",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="11" height="10" viewBox="0 0 11 10">
          <polygon points="5.5,0.5 6.9,3.8 10.5,3.8 7.7,5.9 8.7,9.2 5.5,7.2 2.3,9.2 3.3,5.9 0.5,3.8 4.1,3.8"
            fill={i<=Math.round(n)?"#C4885A":"#E5DDD5"}/>
        </svg>
      ))}
      <span style={{fontSize:11,color:"#8B7B72",marginLeft:3}}>{n.toFixed(1)}</span>
    </span>
  );
}
function Bottle({ style: s }) {
  return (
    <svg style={s} viewBox="0 0 36 60" fill="none">
      <rect x="13" y="1" width="10" height="11" rx="3" fill="white" opacity=".45"/>
      <path d="M9 15 Q7 18 7 22 L7 50 Q7 56 13 56 L23 56 Q29 56 29 50 L29 22 Q29 18 27 15 Z" fill="white" opacity=".35"/>
    </svg>
  );
}

// ── TAG PANEL ──────────────────────────────────────────────────────────
function TagPanel({ groups, selected, onToggle }) {
  return (
    <div className="tag-panel">
      {groups.map((g,gi) => (
        <div key={g.label} style={{marginBottom:gi<groups.length-1?12:0}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:7}}>{g.label}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {g.tags.map(t=>(
              <span key={t} className="tpill"
                style={{background:selected.includes(t)?"#C4885A":"#F0EAE3",color:selected.includes(t)?"#fff":"#8B7B72"}}
                onClick={()=>onToggle(t)}>{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BRAND CARD ─────────────────────────────────────────────────────────
function BrandCard({ brand, dbInfo, isOn, onClick }) {
  const local = BRAND_FALLBACK[brand] || B_DEF;
  const g    = dbInfo?.color_from && dbInfo?.color_to
    ? `linear-gradient(145deg,${dbInfo.color_from},${dbInfo.color_to})` : local.g;
  const logo = dbInfo?.logo_color || local.logo;
  const abbr = dbInfo?.abbr || local.abbr || brand.slice(0,3).toUpperCase();
  const fs   = abbr.length > 5 ? 11 : abbr.length > 3 ? 14 : 20;
  const flag = COUNTRY_LIST.find(c=>c.code===dbInfo?.country)?.flag || "";
  return (
    <div className={`brand-card${isOn?" on":""}`} onClick={onClick}>
      <div style={{height:68,background:g,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {dbInfo?.logo_url
          ? <img src={dbInfo.logo_url} style={{width:48,height:48,objectFit:"contain"}} alt={brand}/>
          : <span style={{fontFamily:"Georgia,serif",fontSize:fs,fontWeight:400,color:logo,letterSpacing:".12em"}}>{abbr}</span>
        }
        {flag&&<span style={{position:"absolute",top:5,right:6,fontSize:15,lineHeight:1}}>{flag}</span>}
      </div>
      <div style={{padding:"6px 8px 8px",textAlign:"center",minHeight:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:10,fontWeight:500,color:isOn?"#C4885A":"#1C1815",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{brand}</p>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ───────────────────────────────────────────────────────
function Card({ p, rank, fav, onFav, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      {rank !== null && rank < 3 && (
        <div className="rbdg" style={{background:rank===0?"#C4885A":rank===1?"#9A9693":"#B8916A"}}>{rank+1}</div>
      )}
      <div style={{height:138,background:p.g,position:"relative",flexShrink:0,overflow:"hidden"}}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",background:"#fff",padding:"6px"}}/>
          : <Bottle style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",width:36,height:58}}/>
        }
        <button className="fav-btn" style={{position:"absolute",top:8,right:8,width:30,height:30}}
          onClick={e=>{e.stopPropagation();onFav(p.id);}}>
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M7 10.5S1 6.8 1 3.2A2.8 2.8 0 0 1 7 1.5 2.8 2.8 0 0 1 13 3.2C13 6.8 7 10.5 7 10.5z"
              fill={fav?"#E05C70":"none"} stroke={fav?"#E05C70":"#777"} strokeWidth="1.4"/>
          </svg>
        </button>
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
          <span style={{fontSize:14,fontWeight:600,color:"#1C1815"}}>{formatPrice(p.price, p.variants?.[0]?.currency||"JPY")}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"#B0A098"}}>{p.volume}</span>
          <span style={{fontSize:10,color:fav?"#E05C70":"#B0A098"}}>♡ {fav?p.favs+1:p.favs}</span>
        </div>
      </div>
    </div>
  );
}

// ── MODAL ──────────────────────────────────────────────────────────────
function Modal({ p, fav, onFav, recs, onClose, onSelect, onBrand, lang }) {
  const [showIngr,   setShowIngr]   = useState(false);
  const [selVariant, setSelVariant] = useState(0);
  const [selImage,   setSelImage]   = useState(0);
  const t = T[lang] || T["日本語"];
  const variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : null;
  const selVar   = variants ? variants[selVariant] : null;
  // 選択中バリアントの画像一覧（なければメイン画像）
  const varImgs    = selVar?.images?.filter(Boolean) || [];
  const allImgs    = varImgs.length > 0 ? varImgs : (p.image_url ? [p.image_url] : []);
  const currentImg = allImgs[selImage] || null;
  const changeVariant = (i) => { setSelVariant(i); setSelImage(0); };
  const displayPrice = selVar?.price || p.price;
  const displayCur   = selVar?.currency || p.variants?.[0]?.currency || "JPY";
  const displayJpy   = selVar?.jpy_price;
  const displayVol   = selVar?.volume || p.volume;
  const shops = p.buyLinks?.length > 0
    ? p.buyLinks
    : [
        {shop_name:"Amazon",           url:null},
        {shop_name:"楽天市場",         url:null},
        {shop_name:"Yahoo! ショッピング", url:null},
        {shop_name:"公式サイト",       url:null},
      ];
  return (
    <div className="ovl" onClick={onClose}>
      <div className="mbox" onClick={e=>e.stopPropagation()}>
        <div style={{height:200,background:currentImg?"#fff":p.g,position:"relative",borderRadius:"16px 16px 0 0",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {currentImg
            ? <img src={currentImg} alt={p.name} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",padding:"10px"}}/>
            : <Bottle style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",width:50,height:80}}/>
          }
          <button className="fav-btn" style={{position:"absolute",top:12,right:50,width:34,height:34,background:"rgba(255,255,255,.88)"}}
            onClick={e=>{e.stopPropagation();onFav(p.id);}}>
            <svg width="16" height="14" viewBox="0 0 16 14">
              <path d="M8 12.5S1 8 1 4A3 3 0 0 1 8 2 3 3 0 0 1 15 4c0 4-7 8.5-7 8.5z" fill={fav?"#E05C70":"none"} stroke={fav?"#E05C70":"white"} strokeWidth="1.5"/>
            </svg>
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
              <p style={{fontSize:19,fontWeight:600,color:"#1C1815"}}>
                {formatPrice(displayPrice, displayCur)}
              </p>
              {displayCur !== "JPY" && displayJpy && (
                <p style={{fontSize:11,color:"#C4885A",marginTop:1}}>≈ ¥{Number(displayJpy).toLocaleString()}</p>
              )}
              <p style={{fontSize:11,color:"#8B7B72",marginTop:2}}>{displayVol}</p>
            </div>
          </div>

          {/* 容量・サイズ選択 */}
          {variants && variants.length > 1 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {variants.map((v,i)=>(
                <span key={i}
                  onClick={()=>changeVariant(i)}
                  style={{
                    display:"inline-flex",flexDirection:"column",alignItems:"center",
                    padding:"5px 12px",borderRadius:10,fontSize:11,cursor:"pointer",
                    border:`1px solid ${selVariant===i?"#C4885A":"#E5DDD5"}`,
                    background:selVariant===i?"#FDF5EF":"#FAF7F3",
                    color:selVariant===i?"#C4885A":"#6B5E55",
                    transition:"all .15s",userSelect:"none",
                  }}>
                  <span style={{fontWeight:600}}>{v.volume}</span>
                  {v.price && <span style={{fontSize:10,marginTop:1}}>{formatPrice(v.price, v.currency||"JPY")}</span>}
                </span>
              ))}
            </div>
          )}

          {/* 画像サムネイル（複数ある場合） */}
          {allImgs.length > 1 && (
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:2}}>
              {allImgs.map((url,i)=>(
                <img key={i} src={url} alt="" onClick={()=>setSelImage(i)}
                  style={{width:54,height:54,objectFit:"contain",borderRadius:6,background:"#F8F8F8",padding:"3px",flexShrink:0,cursor:"pointer",border:`2px solid ${i===selImage?"#C4885A":"#E5DDD5"}`,transition:"border-color .15s"}}/>
              ))}
            </div>
          )}

          <div style={{marginBottom:10}}><Stars n={p.rating}/></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
            {[...p.tags,...p.scenes].map(tag=>(<span key={tag} style={{background:"#F0EAE3",color:"#8B7B72",fontSize:11,padding:"3px 9px",borderRadius:12}}>{tag}</span>))}
          </div>
          {p.desc && (
            <div style={{background:"#F8F4F0",borderRadius:8,padding:"12px 14px",marginBottom:13}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#C4885A",marginBottom:7}}>{t.about.toUpperCase()}</p>
              <p style={{fontSize:13,color:"#3C2820",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{p.desc}</p>
            </div>
          )}
          {(p.top.length>0||p.mid.length>0||p.base.length>0) && (
            <div style={{background:"#F4EFE9",borderRadius:10,padding:"13px 15px",marginBottom:12}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".18em",color:"#C4885A",marginBottom:9}}>{t.notes.toUpperCase()}</p>
              {[[t.top,p.top],[t.mid,p.mid],[t.base,p.base]].map(([lbl,notes])=>notes.length>0&&(
                <div key={lbl} style={{display:"flex",gap:12,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#B0A098",minWidth:68,letterSpacing:".05em",paddingTop:2,flexShrink:0}}>{lbl}</span>
                  <span style={{fontSize:13,color:"#3C2820",lineHeight:1.5}}>{notes.join(" · ")}</span>
                </div>
              ))}
            </div>
          )}
          {p.effects.length>0 && (
            <div style={{marginBottom:13}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:7}}>{t.effects.toUpperCase()}</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {p.effects.map(e=>(<span key={e} style={{background:"#EAF0E8",color:"#3D6B48",fontSize:11,padding:"4px 11px",borderRadius:12}}>{e}</span>))}
              </div>
            </div>
          )}
          {(p.ingr||p.ingr_en||p.ingr_ko||p.ingr_zh) && (() => {
            const ingrMap = { "日本語":p.ingr, "English":p.ingr_en, "한국어":p.ingr_ko, "中文":p.ingr_zh, "Français":p.ingr_en };
            const ingrText = ingrMap[lang] || p.ingr || p.ingr_en || "";
            return (
              <div style={{background:"#F4EFE9",borderRadius:8,padding:"10px 14px",marginBottom:15}}>
                <button className="ingr-toggle" onClick={()=>setShowIngr(!showIngr)}>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:".12em",color:"#8B7B72"}}>{t.ingr.toUpperCase()}</span>
                  <svg width="9" height="5" viewBox="0 0 9 5" style={{transform:showIngr?"rotate(180deg)":"none",transition:"transform .2s"}}>
                    <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="#8B7B72" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  </svg>
                  <span style={{fontSize:10,color:"#B0A098"}}>{showIngr?t.ingrHide:t.ingrShow}</span>
                </button>
                {showIngr && (
                  <>
                    <p style={{fontSize:11,color:"#6B5E55",lineHeight:1.7,marginTop:8}}>{ingrText||"（未登録）"}</p>
                    {/* 他の言語の成分がある場合に切替ボタンを表示 */}
                    {[["日本語",p.ingr],["English",p.ingr_en],["한국어",p.ingr_ko],["中文",p.ingr_zh]].filter(([l,v])=>v&&l!==lang).length>0 && (
                      <p style={{fontSize:10,color:"#B0A098",marginTop:6}}>
                        {[["日本語",p.ingr],["English",p.ingr_en],["한국어",p.ingr_ko],["中文",p.ingr_zh]].filter(([l,v])=>v&&l!==lang).map(([l])=>l).join(" / ")} の成分情報もあります
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })()}
          <div style={{marginBottom:20}}>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:9}}>{t.buy.toUpperCase()}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {shops.map(s=>(
                s.url
                  ? <a key={s.shop_name} href={s.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                      <button className="bbt fill" style={{width:"100%"}}>{t.buyPre}{s.shop_name}{t.buySuf}</button>
                    </a>
                  : <button key={s.shop_name||i} className="bbt out disabled">{t.buyPre}{s.shop_name||"公式サイト"}{t.buySuf}</button>
              ))}
            </div>
          </div>
          {recs.length>0 && (
            <div>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",color:"#8B7B72",marginBottom:9}}>{t.similar.toUpperCase()}</p>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                {recs.map(r=>(
                  <div key={r.id} style={{flex:"0 0 108px",background:"#fff",border:"1px solid #E5DDD5",borderRadius:10,overflow:"hidden",cursor:"pointer"}} onClick={()=>onSelect(r)}>
                    <div style={{height:62,background:r.g,position:"relative"}}>
                      <Bottle style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:22,height:36}}/>
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

// ── LOADING / ERROR SCREENS ────────────────────────────────────────────
function Loading({ msg }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:16}}>
      <div className="spin"/>
      <p style={{fontSize:13,color:"#8B7B72"}}>{msg}</p>
    </div>
  );
}
function ErrorScreen({ msg, onRetry }) {
  return (
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <p style={{fontSize:14,color:"#B03040",marginBottom:12}}>⚠ {msg}</p>
      <button className="cbt" onClick={onRetry}>再試行</button>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [langIdx,   setLangIdx]   = useState(0);
  const lang = LANGS[langIdx];
  const t    = T[lang] || T["日本語"];

  // ① ← ここがポイント。PRODUCTS定数の代わりにフックを使う
  const { products, loading, error, refetch } = useProducts(lang);
  const { brandMap }                           = useBrands();

  const [query,     setQuery]     = useState("");
  const [selTags,   setSelTags]   = useState([]);
  const [selCat,    setSelCat]    = useState("all");
  const [favs,      setFavs]      = useState(new Set());
  const [sort,      setSort]      = useState("views");
  const [view,      setView]      = useState("home");
  const [modal,     setModal]     = useState(null);
  const [showLang,  setShowLang]  = useState(false);
  const [tagOpen,   setTagOpen]   = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandQ,    setBrandQ]    = useState("");
  const [brandCountry, setBrandCountry] = useState("");
  const [curBrand,  setCurBrand]  = useState(null);
  const [brandCat,  setBrandCat]  = useState("all");
  const [brandTags, setBrandTags] = useState([]);

  const allBrands  = [...new Set(products.map(p=>p.brand))].sort();
  const filtBrands = allBrands.filter(b=>{
    if(brandQ && !b.toLowerCase().includes(brandQ.toLowerCase())) return false;
    if(brandCountry && brandMap[b]?.country !== brandCountry) return false;
    return true;
  });

  const openBrand  = b => { setCurBrand(b); setBrandCat("all"); setBrandTags([]); setView("brand"); setBrandOpen(false); };
  const toggleFav  = id => setFavs(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleTag  = tag => { setSelTags(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]); setView("search"); };
  const toggleBTag = tag => setBrandTags(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]);

  const openModal  = p => { setModal(p); trackView(p.id); };

  const sorted = [...products].sort((a,b)=>{
    if(sort==="views") return b.views-a.views; if(sort==="favs") return b.favs-a.favs;
    if(sort==="price_asc") return a.price-b.price; if(sort==="price_desc") return b.price-a.price;
    return b.rating-a.rating;
  });
  const filtered = sorted.filter(p=>{
    if(selCat!=="all"&&p.type!==selCat) return false;
    if(query){const q=query.toLowerCase();if(!p.name.includes(q)&&!p.brand.toLowerCase().includes(q)&&![...p.tags,...p.scenes].some(t2=>t2.includes(q)))return false;}
    if(selTags.length>0&&!selTags.some(t2=>p.tags.includes(t2)||p.scenes.includes(t2)))return false;
    return true;
  });
  const display    = view==="favorites" ? sorted.filter(p=>favs.has(p.id)) : filtered;
  const brandProds = curBrand ? sorted.filter(p=>{
    if(p.brand!==curBrand) return false;
    if(brandCat!=="all"&&p.type!==brandCat) return false;
    if(brandTags.length>0&&!brandTags.some(t2=>p.tags.includes(t2)||p.scenes.includes(t2)))return false;
    return true;
  }) : [];
  const brandItems   = curBrand ? [...new Set(products.filter(p=>p.brand===curBrand).map(p=>p.type))] : [];
  const brandTagList = curBrand ? [...new Set(products.filter(p=>p.brand===curBrand).flatMap(p=>[...p.tags,...p.scenes]))] : [];
  const recs = modal ? products.filter(p=>p.id!==modal.id&&(p.tags.some(t2=>modal.tags.includes(t2))||p.type===modal.type)).slice(0,4) : [];

  return (
    <>
      <style>{CSS}</style>
      <div style={{fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP','Helvetica Neue',sans-serif",background:"#FAF7F3",minHeight:"100vh",color:"#1C1815"}}>
        <header style={{background:"#fff",borderBottom:"1px solid #E5DDD5",position:"sticky",top:0,zIndex:50}}>
          <div style={{maxWidth:1100,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
            <div className="lf" onClick={()=>{setView("home");setQuery("");setSelTags([]);setSelCat("all");setBrandQ("");}} style={{cursor:"pointer"}}>
              <span style={{fontSize:21,fontWeight:400}}><span style={{color:"#C4885A"}}>Kaorido</span></span>
              <span style={{display:"block",fontSize:9,letterSpacing:".32em",color:"#B0A098",marginTop:-3}}>FRAGRANCE GUIDE</span>
            </div>
            <nav style={{display:"flex",gap:18,alignItems:"center"}}>
              {[["home",t.home],["ranking",t.ranking],["favorites",`${t.favNav}${favs.size>0?` (${favs.size})`:""}`]].map(([id,lbl])=>(
                <span key={id} className={`nvb${view===id?" on":""}`} style={{color:view===id?"#C4885A":"#6B5E55"}} onClick={()=>setView(id)}>{lbl}</span>
              ))}
            </nav>
            <div style={{position:"relative"}}>
              <button style={{background:"none",border:"1px solid #E5DDD5",borderRadius:6,padding:"4px 11px",fontSize:12,color:"#6B5E55",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}} onClick={()=>setShowLang(!showLang)}>
                {lang}
                <svg width="8" height="5" viewBox="0 0 8 5"><path d="M0.5 0.5L4 4L7.5 0.5" stroke="#8B7B72" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
              </button>
              {showLang&&(<div className="ldd">{LANGS.map((l,i)=>(<div key={i} className="ldi" onClick={()=>{setLangIdx(i);setShowLang(false);}}>{l}</div>))}</div>)}
            </div>
          </div>
        </header>

        <main style={{maxWidth:1100,margin:"0 auto",padding:"20px 20px 64px"}}>
          {/* 検索エリア */}
          <div style={{marginBottom:20}}>
            <div className="si" style={{position:"relative",marginBottom:10}}>
              <svg style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)"}} width="16" height="16" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#9A8A82" strokeWidth="1.4"/><path d="M11 11l4 4" stroke="#9A8A82" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <input placeholder={t.searchPh} value={query} onChange={e=>{setQuery(e.target.value);setView(e.target.value?"search":"home");}}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {CATS.map(c=>(<button key={c.id} className={`cbt${selCat===c.id?" on":""}`} onClick={()=>{setSelCat(c.id);setView(query?"search":"home");}}>{c.l}</button>))}
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
                  {/* 国フィルター */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                    <span
                      style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${!brandCountry?"#C4885A":"#E5DDD5"}`,background:!brandCountry?"#C4885A":"#FAF7F3",color:!brandCountry?"#fff":"#6B5E55",transition:"all .15s",userSelect:"none"}}
                      onClick={()=>setBrandCountry("")}>すべて</span>
                    {COUNTRY_LIST.map(c=>(
                      <span key={c.code}
                        style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${brandCountry===c.code?"#C4885A":"#E5DDD5"}`,background:brandCountry===c.code?"#C4885A":"#FAF7F3",color:brandCountry===c.code?"#fff":"#6B5E55",transition:"all .15s",userSelect:"none"}}
                        onClick={()=>setBrandCountry(brandCountry===c.code?"":c.code)}>
                        <span style={{fontSize:14}}>{c.flag}</span>{c.name}
                      </span>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(118px,1fr))",gap:8}}>
                    {filtBrands.map(b=>(<BrandCard key={b} brand={b} dbInfo={brandMap[b]} isOn={curBrand===b&&view==="brand"} onClick={()=>openBrand(b)}/>))}
                    {filtBrands.length===0&&<p style={{fontSize:12,color:"#B0A098",gridColumn:"1/-1"}}>該当なし</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ローディング・エラー */}
          {loading && <Loading msg={t.loading}/>}
          {!loading && error && <ErrorScreen msg={t.error} onRetry={refetch}/>}

          {/* ブランドページ */}
          {!loading && !error && view==="brand" && curBrand && (
            <>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <button className="back-btn" onClick={()=>{setView("home");setCurBrand(null);}}>
                  <svg width="12" height="10" viewBox="0 0 12 10"><path d="M5 1L1 5l4 4M1 5h10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t.back}
                </button>
                <h2 className="lf" style={{fontSize:20,fontWeight:400,color:"#1C1815"}}>{curBrand}</h2>
                <span style={{fontSize:12,color:"#B0A098"}}>({products.filter(p=>p.brand===curBrand).length}{t.items})</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:9}}>
                <button className={`cbt${brandCat==="all"?" on":""}`} onClick={()=>setBrandCat("all")}>すべて</button>
                {brandItems.map(c=>(<button key={c} className={`cbt${brandCat===c?" on":""}`} onClick={()=>setBrandCat(c)}>{c}</button>))}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
                {brandTagList.map(tag=>(<span key={tag} className="tpill" style={{background:brandTags.includes(tag)?"#C4885A":"#F0EAE3",color:brandTags.includes(tag)?"#fff":"#8B7B72"}} onClick={()=>toggleBTag(tag)}>{tag}</span>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                {brandProds.map(p=>(<Card key={p.id} p={p} rank={null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
              </div>
              {brandProds.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:"#B0A098"}}><p>{t.noResult}</p></div>}
            </>
          )}

          {/* 通常ビュー */}
          {!loading && !error && view!=="brand" && (
            <>
              {view==="home"&&!query&&selTags.length===0&&(
                <div style={{background:"linear-gradient(135deg,#F5ECE0,#EDE0D4)",borderRadius:14,padding:"28px 32px",marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden"}}>
                  <div>
                    <p style={{fontSize:10,letterSpacing:".3em",color:"#C4885A",marginBottom:7}}>FIND YOUR SIGNATURE SCENT</p>
                    <h1 className="lf" style={{fontSize:26,fontWeight:400,lineHeight:1.38,marginBottom:9,color:"#1C1815"}}>あなただけの香りを<br/>見つけましょう</h1>
                    <p style={{fontSize:13,color:"#8B7B72",lineHeight:1.75}}>好みの香り・シーン・アイテムから<br/>最適なフレグランスを提案します</p>
                  </div>
                  <div style={{fontSize:90,color:"#C4885A",opacity:.08,fontFamily:"Georgia,serif",lineHeight:1,flexShrink:0}}>◈</div>
                </div>
              )}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:13,color:"#8B7B72"}}>
                  {view==="favorites"&&`${t.favNav}（${display.length}${t.items}）`}
                  {view==="ranking"&&t.ranking}
                  {(view==="home"||view==="search")&&`${display.length}${t.items}`}
                </span>
                <select className="ssel" value={sort} onChange={e=>setSort(e.target.value)}>
                  {SORTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              {view==="ranking"&&(<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{SORTS.map(o=>(<button key={o.v} className={`cbt${sort===o.v?" on":""}`} onClick={()=>setSort(o.v)}>{o.l}</button>))}</div>)}
              {view==="favorites"&&favs.size===0&&(
                <div style={{textAlign:"center",padding:"60px 20px",color:"#8B7B72"}}>
                  <svg width="44" height="40" viewBox="0 0 44 40" style={{marginBottom:14,opacity:.22}}><path d="M22 36S2 24 2 11A9 9 0 0 1 22 6 9 9 0 0 1 42 11C42 24 22 36 22 36z" stroke="#8B7B72" strokeWidth="2" fill="none"/></svg>
                  <p style={{fontSize:14,marginBottom:6}}>{t.noFav}</p>
                  <p style={{fontSize:12,color:"#B0A098"}}>{t.noFavSub}</p>
                </div>
              )}
              {!(view==="favorites"&&favs.size===0)&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
                  {display.map((p,i)=>(<Card key={p.id} p={p} rank={view==="home"||view==="ranking"?i:null} fav={favs.has(p.id)} onFav={toggleFav} onClick={()=>openModal(p)}/>))}
                </div>
              )}
            </>
          )}
        </main>

        {modal&&(<Modal p={modal} fav={favs.has(modal.id)} onFav={toggleFav} recs={recs} lang={lang}
          onClose={()=>setModal(null)} onSelect={p=>setModal(p)} onBrand={openBrand}/>)}
      </div>
    </>
  );
}
