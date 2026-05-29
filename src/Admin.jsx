import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Hiragino Kaku Gothic ProN','Noto Sans JP','Helvetica Neue',sans-serif;}
.adm-wrap{display:flex;min-height:100vh;background:#F4F2EF;}
.adm-side{width:220px;flex-shrink:0;background:#1C1815;padding:0;display:flex;flex-direction:column;}
.adm-logo{padding:20px 20px 16px;border-bottom:1px solid #2C2420;}
.adm-logo span{color:#C4885A;font-size:18px;font-family:Georgia,serif;}
.adm-logo small{display:block;font-size:9px;letter-spacing:.3em;color:#6B5E55;margin-top:2px;}
.adm-nav a{display:flex;align-items:center;gap:10px;padding:11px 20px;font-size:13px;color:#8B7B72;cursor:pointer;text-decoration:none;transition:all .15s;border-left:3px solid transparent;}
.adm-nav a:hover{color:#D4B8A0;background:#241F1C;}
.adm-nav a.on{color:#C4885A;background:#241F1C;border-left-color:#C4885A;}
.adm-main{flex:1;padding:28px 32px;overflow-y:auto;}
.adm-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.adm-title{font-size:20px;font-weight:500;color:#1C1815;}
.card{background:#fff;border-radius:12px;border:1px solid #E5DDD5;padding:24px;margin-bottom:16px;}
.form-row{display:grid;gap:14px;margin-bottom:14px;}
.form-row.cols2{grid-template-columns:1fr 1fr;}
.form-row.cols3{grid-template-columns:1fr 1fr 1fr;}
.fld label{display:block;font-size:11px;font-weight:600;letter-spacing:.1em;color:#8B7B72;margin-bottom:5px;}
.fld input,.fld select,.fld textarea{width:100%;border:1px solid #E5DDD5;border-radius:7px;padding:8px 11px;font-size:13px;color:#1C1815;font-family:inherit;outline:none;transition:border-color .15s;background:#FAF7F3;}
.fld input:focus,.fld select:focus,.fld textarea:focus{border-color:#C4885A;}
.fld textarea{resize:vertical;min-height:72px;line-height:1.6;}
.btn{border-radius:8px;padding:9px 20px;font-size:13px;font-family:inherit;cursor:pointer;border:none;transition:all .15s;font-weight:500;}
.btn.primary{background:#C4885A;color:#fff;}.btn.primary:hover{background:#A8714A;}
.btn.secondary{background:#F0EAE3;color:#6B5E55;border:1px solid #E5DDD5;}.btn.secondary:hover{background:#E5DDD5;}
.btn.danger{background:#FEE2E2;color:#991B1B;}.btn.danger:hover{background:#FECACA;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.btn-sm{padding:5px 12px;font-size:12px;border-radius:6px;}
.tag-grid{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:#FAF7F3;border:1px solid #E5DDD5;border-radius:7px;min-height:44px;}
.tag-pill{border-radius:12px;font-size:11px;padding:3px 10px;cursor:pointer;user-select:none;transition:all .15s;}
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{text-align:left;padding:10px 12px;font-size:11px;font-weight:600;letter-spacing:.1em;color:#8B7B72;border-bottom:2px solid #E5DDD5;}
.tbl td{padding:11px 12px;border-bottom:1px solid #F0EAE3;color:#1C1815;vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:#FAF7F3;}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;}
.toast{position:fixed;bottom:24px;right:24px;background:#1C1815;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;z-index:999;animation:fadein .2s ease;}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.note-inputs{display:flex;flex-direction:column;gap:6px;}
.note-row{display:flex;gap:6px;align-items:center;}
.note-row input{flex:1;}
.sep{height:1px;background:#E5DDD5;margin:20px 0;}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.stat{background:#fff;border:1px solid #E5DDD5;border-radius:10px;padding:16px 20px;}
.stat-n{font-size:26px;font-weight:500;color:#C4885A;}
.stat-l{font-size:11px;color:#8B7B72;margin-top:2px;}
.img-upload-area{border:2px dashed #E5DDD5;border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:all .15s;background:#FAF7F3;overflow:hidden;max-width:100%;}
.img-upload-area:hover{border-color:#C4885A;background:#FDF5EF;}
.img-preview{width:100%;max-width:100%;height:180px;object-fit:contain;border-radius:8px;margin-bottom:8px;display:block;background:#F0EAE3;}
.img-preview-sm{width:80px;height:80px;object-fit:contain;border-radius:8px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;background:#F0EAE3;}
`;

const ITEM_TYPES = [
  "香水","ボディミスト","ディフューザー","お香","アロマオイル","ロールオン",
  "アロマキャンドル","ヘアオイル","ヘアミスト","ボディクリーム","柔軟剤",
  "ファブリックミスト","ルームフレグランス","サシェ","バスソルト",
  "ハンドクリーム","ボディウォッシュ","練り香水",
];
const SHOPS = ["Amazon","楽天市場","Yahoo! ショッピング","公式サイト","Qoo10","ZOZOTOWN","@cosme SHOPPING"];
const COUNTRIES = [
  { code:"",      flag:"",   name:"未選択" },
  { code:"JP",    flag:"🇯🇵", name:"日本" },
  { code:"KR",    flag:"🇰🇷", name:"韓国" },
  { code:"CN",    flag:"🇨🇳", name:"中国" },
  { code:"US",    flag:"🇺🇸", name:"アメリカ" },
  { code:"FR",    flag:"🇫🇷", name:"フランス" },
  { code:"GB",    flag:"🇬🇧", name:"イギリス" },
  { code:"IT",    flag:"🇮🇹", name:"イタリア" },
  { code:"DE",    flag:"🇩🇪", name:"ドイツ" },
  { code:"ES",    flag:"🇪🇸", name:"スペイン" },
  { code:"SE",    flag:"🇸🇪", name:"スウェーデン" },
  { code:"NL",    flag:"🇳🇱", name:"オランダ" },
  { code:"AU",    flag:"🇦🇺", name:"オーストラリア" },
  { code:"CA",    flag:"🇨🇦", name:"カナダ" },
  { code:"OTHER", flag:"🌍",  name:"その他" },
];
const ALL_TAGS = [
  // 香りの系統
  "#フローラル","#シトラス","#ウッディ","#グルマン","#フルーティ","#クリーン",
  "#セクシー","#ナチュラル","#パウダリー","#スパイシー","#アクア","#オリエンタル",
  "#ハーバル","#ムスキー","#グリーン","#スモーキー","#レザー","#インセンス",
  "#ベリー","#ミント","#フローラルフルーティ","#シトラスフローラル",
  // シーン・用途
  "#デート","#オフィス","#リラックス","#春夏","#秋冬","#特別な日",
  "#日常","#就寝前","#ヨガ","#読書","#夜","#リビング",
  "#朝","#通勤","#お出かけ","#屋外","#お風呂上がり","#休日",
  // 印象・雰囲気
  "#フェミニン","#ユニセックス","#ラグジュアリー","#カジュアル","#清楚",
  "#エレガント","#和","#明るい","#癒し","#アジアン",
  "#甘い","#さわやか","#個性的","#大人っぽい","#可愛い",
  "#ロマンティック","#華やか","#落ち着き","#初心者向け",
];

const CURRENCIES = [
  { code:"JPY", symbol:"¥",   name:"日本円",              flag:"🇯🇵" },
  { code:"USD", symbol:"$",   name:"米ドル",              flag:"🇺🇸" },
  { code:"EUR", symbol:"€",   name:"ユーロ",              flag:"🇪🇺" },
  { code:"GBP", symbol:"£",   name:"英ポンド",            flag:"🇬🇧" },
  { code:"KRW", symbol:"₩",   name:"韓国ウォン",          flag:"🇰🇷" },
  { code:"CNY", symbol:"¥",   name:"中国元",              flag:"🇨🇳" },
  { code:"CAD", symbol:"CA$", name:"カナダドル",          flag:"🇨🇦" },
  { code:"AUD", symbol:"A$",  name:"オーストラリアドル",  flag:"🇦🇺" },
  { code:"SEK", symbol:"kr",  name:"スウェーデンクローナ",flag:"🇸🇪" },
  { code:"CHF", symbol:"CHF", name:"スイスフラン",        flag:"🇨🇭" },
];

// ── 通貨付き価格入力（リアルタイム円換算） ──────────────────
function CurrencyPriceInput({ price, currency, onPriceChange, onCurrencyChange }) {
  const [jpyEquiv, setJpyEquiv] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const iStyle = {border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit",width:"100%"};

  useEffect(() => {
    if (!price || currency === "JPY") { setJpyEquiv(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch("https://api.frankfurter.app/latest?from="+currency+"&to=JPY");
        const data = await res.json();
        const rate = data.rates?.JPY;
        if (rate) setJpyEquiv(Math.round(parseFloat(price) * rate));
      } catch(e) { console.error("為替取得失敗", e); }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [price, currency]);

  const cur = CURRENCIES.find(c=>c.code===currency) || CURRENCIES[0];

  return (
    <div>
      <div style={{display:"flex",gap:6}}>
        <select value={currency} onChange={e=>onCurrencyChange(e.target.value)}
          style={{...iStyle,width:110,flexShrink:0,padding:"7px 6px"}}>
          {CURRENCIES.map(c=>(
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#8B7B72",pointerEvents:"none"}}>{cur.symbol}</span>
          <input type="number" placeholder="例: 19800" value={price}
            onChange={e=>onPriceChange(e.target.value)}
            style={{...iStyle,paddingLeft:cur.symbol.length>1?36:24}}/>
        </div>
      </div>
      {currency !== "JPY" && (
        <p style={{fontSize:11,marginTop:5,color:jpyEquiv?"#C4885A":"#B0A098"}}>
          {loading?"換算中...": jpyEquiv?"≈ ¥"+jpyEquiv.toLocaleString()+" （参考・登録時レート）":price?"円換算を取得中..":"金額を入力すると円換算が表示されます"}
        </p>
      )}
    </div>
  );
}

// ── 画像アップロード ────────────────────────────────────────
function ImageUpload({ value, onChange, folder="products", label="画像", preview="normal" }) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(value||null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file||!file.type.startsWith("image/")) { alert("画像ファイルを選択してください"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const ext = file.name.includes(".")?file.name.split(".").pop().toLowerCase():"jpg";
      const safeName = `img_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
      const buf = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage.from("images").upload(safeName, buf, { contentType:file.type, upsert:true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("images").getPublicUrl(safeName);
      onChange(data.publicUrl);
    } catch(e) { alert("アップロードエラー: "+e.message); setLocalPreview(null); }
    setUploading(false);
  };

  const displaySrc = localPreview||value;
  return (
    <div className="fld">
      <label>{label}</label>
      <div className="img-upload-area" onClick={()=>inputRef.current.click()}
        onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}>
        {displaySrc ? (
          <>
            <img src={displaySrc} className={preview==="sm"?"img-preview-sm":"img-preview"} alt="preview" style={{margin:"0 auto"}}/>
            <p style={{fontSize:11,color:"#8B7B72"}}>{uploading?"アップロード中...":"クリックまたはドラッグで変更"}</p>
          </>
        ) : (
          <>
            <div style={{fontSize:28,marginBottom:6,color:"#C4885A",opacity:.6}}>📷</div>
            <p style={{fontSize:13,color:"#8B7B72",marginBottom:3}}>{uploading?"アップロード中...":"クリックまたはドラッグ＆ドロップ"}</p>
            <p style={{fontSize:11,color:"#B0A098"}}>JPG・PNG・WEBP対応</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
    </div>
  );
}

// ── 複数画像アップロード ────────────────────────────────────
function MultiImageUpload({ images=[], onChange, folder="products" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const ext = file.name.includes(".")?file.name.split(".").pop().toLowerCase():"jpg";
        const safeName = `img_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
        const buf = await file.arrayBuffer();
        const { error } = await supabase.storage.from("images").upload(safeName, buf, { contentType:file.type, upsert:true });
        if (error) throw error;
        const { data } = supabase.storage.from("images").getPublicUrl(safeName);
        uploaded.push(data.publicUrl);
      } catch(e) { alert("アップロードエラー: "+e.message); }
    }
    onChange([...images, ...uploaded]);
    setUploading(false);
  };

  const remove = (i) => onChange(images.filter((_,j)=>j!==i));

  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
        {images.map((url,i)=>(
          <div key={i} style={{position:"relative",width:60,height:60}}>
            <img src={url} style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #E5DDD5"}} alt=""/>
            <button onClick={()=>remove(i)}
              style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:"#E05C70",border:"none",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          </div>
        ))}
        <div onClick={()=>inputRef.current.click()}
          style={{width:60,height:60,border:"2px dashed #E5DDD5",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAF7F3",flexShrink:0,transition:"all .15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#C4885A"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="#E5DDD5"}>
          <span style={{fontSize:20,color:"#C4885A",opacity:.7}}>{uploading?"…":"+"}</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
    </div>
  );
}

function Toast({ msg }) { return msg ? <div className="toast">{msg}</div> : null; }

function Dashboard({ counts }) {
  return (
    <div>
      <div className="stat-grid">
        {[["商品数",counts.products],["ブランド数",counts.brands],["タグ数",counts.tags]].map(([l,n])=>(
          <div className="stat" key={l}><div className="stat-n">{n??"—"}</div><div className="stat-l">{l}</div></div>
        ))}
      </div>
      <div className="card">
        <p style={{fontSize:14,color:"#6B5E55",lineHeight:1.8}}>
          左メニューから操作してください。<br/>
          <strong style={{color:"#C4885A"}}>ブランド登録</strong>を先に行い、その後<strong style={{color:"#C4885A"}}>商品登録</strong>に進むとスムーズです。
        </p>
      </div>
    </div>
  );
}

function BrandForm({ onSave }) {
  const empty = { name:"", abbr:"", color_from:"#F8E6EC", color_to:"#EDD0D8", logo_color:"#8A2040", description_ja:"", official_url:"", logo_url:"", country:"" };
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const save = async () => {
    if (!f.name.trim()) return alert("ブランド名は必須です");
    setSaving(true);
    const { error } = await supabase.from("brands").upsert([f], { onConflict:"name" });
    setSaving(false);
    if (error) return alert("エラー: "+error.message);
    onSave("ブランドを登録しました");
    setF(empty);
  };

  return (
    <div className="card">
      <div className="form-row cols2">
        <div className="fld"><label>ブランド名 *</label><input placeholder="例: Dior" value={f.name} onChange={e=>set("name",e.target.value)}/></div>
        <div className="fld"><label>略称（カード表示用）</label><input placeholder="例: Dior, AdP, YSL" value={f.abbr} onChange={e=>set("abbr",e.target.value)}/></div>
      </div>
      <div className="form-row">
        <div className="fld">
          <label>国・地域</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {COUNTRIES.filter(c=>c.code).map(c=>(
              <span key={c.code} onClick={()=>set("country",f.country===c.code?"":c.code)}
                style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${f.country===c.code?"#C4885A":"#E5DDD5"}`,background:f.country===c.code?"#C4885A":"#FAF7F3",color:f.country===c.code?"#fff":"#6B5E55",transition:"all .15s",userSelect:"none"}}>
                <span style={{fontSize:16}}>{c.flag}</span>{c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="form-row">
        <ImageUpload value={f.logo_url} onChange={v=>set("logo_url",v)} folder="brands" label="ブランドロゴ画像（任意）" preview="sm"/>
      </div>
      <div className="form-row cols3">
        <div className="fld">
          <label>カード色①</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/>
            <input value={f.color_from} onChange={e=>set("color_from",e.target.value)}/>
          </div>
        </div>
        <div className="fld">
          <label>カード色②</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/>
            <input value={f.color_to} onChange={e=>set("color_to",e.target.value)}/>
          </div>
        </div>
        <div className="fld">
          <label>ロゴ文字色</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={f.logo_color} onChange={e=>set("logo_color",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/>
            <input value={f.logo_color} onChange={e=>set("logo_color",e.target.value)}/>
          </div>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:".1em",color:"#8B7B72",marginBottom:6}}>カードプレビュー</label>
        <div style={{width:130,borderRadius:10,overflow:"hidden",border:"1px solid #E5DDD5",display:"inline-block"}}>
          <div style={{height:68,background:`linear-gradient(145deg,${f.color_from},${f.color_to})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            {f.logo_url
              ? <img src={f.logo_url} style={{width:48,height:48,objectFit:"contain"}} alt="logo"/>
              : <span style={{fontFamily:"Georgia,serif",fontSize:f.abbr.length>5?11:f.abbr.length>3?14:20,color:f.logo_color,letterSpacing:".12em"}}>{f.abbr||f.name.slice(0,3)||"◈"}</span>
            }
          </div>
          <div style={{padding:"6px 8px",background:"#fff",textAlign:"center"}}>
            <p style={{fontSize:10,fontWeight:500,color:"#1C1815"}}>{f.name||"ブランド名"}</p>
          </div>
        </div>
      </div>
      <div className="form-row">
        <div className="fld"><label>ブランド説明（日本語）</label><textarea placeholder="ブランドの説明を入力..." value={f.description_ja} onChange={e=>set("description_ja",e.target.value)}/></div>
      </div>
      <div className="form-row">
        <div className="fld"><label>公式サイトURL</label><input placeholder="https://www.dior.com" value={f.official_url} onChange={e=>set("official_url",e.target.value)}/></div>
      </div>
      <button className="btn primary" onClick={save} disabled={saving}>{saving?"登録中...":"ブランドを登録"}</button>
    </div>
  );
}

function ProductForm({ onSave, editId }) {
  const [brands, setBrands]         = useState([]);
  const [allEffects, setAllEffects] = useState([]);
  const [selTags, setSelTags]       = useState([]);
  const [selEffects, setSelEffects] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newEffectInput, setNewEffectInput] = useState("");
  const [notes, setNotes]           = useState({ top:[""], mid:[""], base:[""] });
  const [links, setLinks]           = useState([{ shop_name:"Amazon", url:"", affiliate_code:"", current_price:"" }]);
  const [saving, setSaving]         = useState(false);
  const [variants, setVariants]     = useState([{volume:"", price:"", currency:"JPY", jpy_price:null, weight:"", dimensions:"", images:[]}]);
  const [f, setF] = useState({
    brand_id:"", name:"", type:"香水",
    desc_ja:"", desc_en:"", desc_ko:"", desc_zh:"", desc_fr:"",
    ingredients:"", ingr_en:"", ingr_ko:"", ingr_zh:"", color_from:"#FFB3C1", color_to:"#FF8FAB",
    image_url:"", is_published:true,
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const addVariant    = () => setVariants(p=>[...p, {volume:"",price:"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
  const setVariant    = (i,k,v) => setVariants(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const removeVariant = i => setVariants(p=>p.filter((_,j)=>j!==i));

  const [loadingEdit, setLoadingEdit] = useState(false);
  const editLoadedRef = useRef(null); // StrictMode二重実行防止

  useEffect(() => {
    supabase.from("brands").select("id,name").order("name").then(({data})=>setBrands(data||[]));
    supabase.from("effects").select("*").order("name_ja").then(({data})=>setAllEffects(data||[]));
    supabase.from("tags").select("*").order("name").then(({data})=>{
      if (data?.length) setDynamicTags(data.map(t=>t.name));
    });
  }, []);

  // 編集モード: 既存データを読み込む
  useEffect(() => {
    if (!editId || editLoadedRef.current === editId) return;
    editLoadedRef.current = editId;
    setLoadingEdit(true);
    (async () => {
      const { data: p } = await supabase.from("products")
        .select("*, fragrance_notes(*), product_tags(tags(name)), product_effects(effect_id), buy_links(*)")
        .eq("id", editId).single();
      if (!p) { setLoadingEdit(false); return; }

      // グラデーションから色を抽出
      const colorMatch = (p.gradient||"").match(/#[0-9A-Fa-f]{6}/g);
      setF({
        brand_id: p.brand_id||"", name: p.name||"", type: p.type||"香水",
        desc_ja: p.desc_ja||"", desc_en: p.desc_en||"", desc_ko: p.desc_ko||"",
        desc_zh: p.desc_zh||"", desc_fr: p.desc_fr||"",
        ingredients: p.ingredients||"", ingr_en: p.ingr_en||"",
        ingr_ko: p.ingr_ko||"", ingr_zh: p.ingr_zh||"",
        color_from: colorMatch?.[0]||"#FFB3C1", color_to: colorMatch?.[1]||"#FF8FAB",
        image_url: p.image_url||"", is_published: p.is_published??true,
      });
      // バリアント
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        setVariants(p.variants);
      } else if (p.price || p.volume) {
        setVariants([{volume:p.volume||"", price:p.price||"", currency:"JPY", jpy_price:null, weight:"", dimensions:"", images:[]}]);
      }
      // ノート（重複除去して読み込み）
      const noteObj = { top:[], mid:[], base:[] };
      const seenNotes = new Set();
      (p.fragrance_notes||[]).sort((a,b)=>a.display_order-b.display_order).forEach(n => {
        const key = n.note_type + ":" + n.ingredient_name;
        if (noteObj[n.note_type] && !seenNotes.has(key)) {
          seenNotes.add(key);
          noteObj[n.note_type].push(n.ingredient_name);
        }
      });
      setNotes({ top: noteObj.top.length?noteObj.top:[""], mid: noteObj.mid.length?noteObj.mid:[""], base: noteObj.base.length?noteObj.base:[""] });
      // タグ（重複除去）
      setSelTags([...new Set((p.product_tags||[]).map(pt=>pt.tags?.name).filter(Boolean))]);
      // 効果（重複除去）
      setSelEffects([...new Set((p.product_effects||[]).map(pe=>pe.effect_id).filter(Boolean))]);
      // 購入リンク（重複除去）
      if ((p.buy_links||[]).length > 0) {
        const seenShops = new Set();
        const uniqueLinks = p.buy_links.filter(l=>{
          const k = l.shop_name+l.url;
          if (seenShops.has(k)) return false;
          seenShops.add(k); return true;
        });
        setLinks(uniqueLinks.map(l=>({ shop_name:l.shop_name||"", url:l.url||"", affiliate_code:l.affiliate_code||"", current_price:l.current_price||"" })));
      }
      setLoadingEdit(false);
    })();
  }, [editId]);

  const addNote    = type => setNotes(p=>({...p,[type]:[...p[type],""]}));
  const setNote    = (type,i,v) => setNotes(p=>({...p,[type]:p[type].map((x,j)=>j===i?v:x)}));
  const removeNote = (type,i) => setNotes(p=>({...p,[type]:p[type].filter((_,j)=>j!==i)}));
  const addLink    = () => setLinks(p=>[...p,{shop_name:"Amazon",url:"",affiliate_code:"",current_price:""}]);
  const setLink    = (i,k,v) => setLinks(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const removeLink = i => setLinks(p=>p.filter((_,j)=>j!==i));
  const toggleTag    = t  => setSelTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const toggleEffect = id => setSelEffects(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const save = async () => {
    if (!f.brand_id) return alert("ブランドを選択してください");
    if (!f.name.trim()) return alert("商品名は必須です");
    const validVariants = variants.filter(v=>v.volume.trim()||v.price);
    // 円換算価格を取得（非JPYは為替レートで変換）
    const toJpy = async (price, currency) => {
      if (!price) return null;
      if (currency === "JPY" || !currency) return parseInt(price);
      try {
        const res  = await fetch("https://api.frankfurter.app/latest?from="+currency+"&to=JPY");
        const data = await res.json();
        return Math.round(parseFloat(price) * (data.rates?.JPY || 1));
      } catch { return parseInt(price); }
    };
    const jpyPrices = await Promise.all(validVariants.map(v=>toJpy(v.price, v.currency)));
    const variantsWithJpy = validVariants.map((v,i)=>({...v, jpy_price: jpyPrices[i]}));
    const minPrice = jpyPrices.filter(Boolean).length > 0
      ? Math.min(...jpyPrices.filter(Boolean))
      : null;
    const gradient = `linear-gradient(145deg,${f.color_from},${f.color_to})`;
    setSaving(true);
    try {
      const productData = {
        ...f,
        price: minPrice,
        volume: validVariants.map(v=>v.volume).filter(Boolean).join(" / "),
        variants: variantsWithJpy,
        gradient,
      };

      let pid;
      if (editId) {
        // 更新モード
        const { error: e1 } = await supabase.from("products").update(productData).eq("id", editId);
        if (e1) throw e1;
        pid = editId;
        // 関連テーブルを一旦削除して再登録
        // 既存の関連データを削除（RLS DELETE権限が必要）
        const delResults = await Promise.all([
          supabase.from("fragrance_notes").delete().eq("product_id", pid),
          supabase.from("product_tags").delete().eq("product_id", pid),
          supabase.from("product_effects").delete().eq("product_id", pid),
          supabase.from("buy_links").delete().eq("product_id", pid),
        ]);
        const delErrors = delResults.filter(r=>r.error).map(r=>r.error.message);
        if (delErrors.length > 0) {
          console.error("削除エラー:", delErrors);
          throw new Error("削除エラー: " + delErrors.join(", "));
        }
      } else {
        // 新規登録モード
        const { data: prod, error: e1 } = await supabase.from("products").insert([productData]).select().single();
        if (e1) throw e1;
        pid = prod.id;
      }

      const noteRows = [];
      ["top","mid","base"].forEach(type => {
        notes[type].forEach((name,i) => {
          if (name.trim()) noteRows.push({ product_id:pid, note_type:type, ingredient_name:name.trim(), display_order:i });
        });
      });
      if (noteRows.length) await supabase.from("fragrance_notes").insert(noteRows);
      if (selTags.length) {
        const { data: tagRows } = await supabase.from("tags").select("id,name").in("name", selTags);
        if (tagRows?.length) await supabase.from("product_tags").insert(tagRows.map(t=>({ product_id:pid, tag_id:t.id })));
      }
      if (selEffects.length) await supabase.from("product_effects").insert(selEffects.map(id=>({ product_id:pid, effect_id:id })));
      const linkRows = links.filter(l=>l.url.trim()||l.shop_name.trim()).map(l=>({
        product_id:pid, shop_name:l.shop_name, url:l.url||null,
        affiliate_code:l.affiliate_code||null, current_price:l.current_price?parseInt(l.current_price):null,
      }));
      if (linkRows.length) await supabase.from("buy_links").insert(linkRows);

      onSave(editId ? "商品を更新しました！" : "商品を登録しました！");
      if (!editId) {
        setF({brand_id:"",name:"",type:"香水",desc_ja:"",desc_en:"",desc_ko:"",desc_zh:"",desc_fr:"",ingredients:"",ingr_en:"",ingr_ko:"",ingr_zh:"",color_from:"#FFB3C1",color_to:"#FF8FAB",image_url:"",is_published:true});
        setVariants([{volume:"",price:"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
        setSelTags([]); setSelEffects([]); setNotes({top:[""],mid:[""],base:[""]}); setLinks([{shop_name:"Amazon",url:"",affiliate_code:"",current_price:""}]);
      }
    } catch(e) { alert("エラー: "+e.message); }
    setSaving(false);
  };

  if (loadingEdit) return (
    <div className="card" style={{textAlign:"center",padding:"60px 20px",color:"#8B7B72"}}>
      <div style={{fontSize:13}}>データを読み込み中...</div>
    </div>
  );

  const iStyle = {width:"100%",border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit"};
  const lStyle = {fontSize:10,fontWeight:600,letterSpacing:".1em",color:"#B0A098",display:"block",marginBottom:4};

  return (
    <div className="card">
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>基本情報</p>
      <div className="form-row cols2">
        <div className="fld">
          <label>ブランド *</label>
          <select value={f.brand_id} onChange={e=>set("brand_id",e.target.value)}>
            <option value="">選択してください</option>
            {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>アイテム種別 *</label>
          <select value={f.type} onChange={e=>set("type",e.target.value)}>
            {ITEM_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row cols2">
        <div className="fld"><label>商品名 *</label><input placeholder="例: チャンス オー タンドル" value={f.name} onChange={e=>set("name",e.target.value)}/></div>
        <div className="fld">
          <label>公開設定</label>
          <select value={f.is_published} onChange={e=>set("is_published",e.target.value==="true")}>
            <option value="true">公開</option><option value="false">非公開（下書き）</option>
          </select>
        </div>
      </div>

      {/* ── 容量・価格（複数対応） ── */}
      <div className="fld" style={{marginBottom:14}}>
        <label>容量・価格・サイズ（複数ある場合は追加）</label>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:6}}>
          {variants.map((v,i)=>(
            <div key={i} style={{background:"#FAF7F3",borderRadius:8,padding:"12px 14px",border:"1px solid #E5DDD5"}}>
              {/* 1行目: 容量・価格・重さ・サイズ・削除ボタン */}
              <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:10}}>
                <div style={{flex:1}}>
                  <label style={lStyle}>容量</label>
                  <input placeholder="例: 50ml" value={v.volume} onChange={e=>setVariant(i,"volume",e.target.value)} style={iStyle}/>
                </div>
                <div style={{flex:2,minWidth:0}}>
                  <label style={lStyle}>価格・通貨</label>
                  <CurrencyPriceInput
                    price={v.price}
                    currency={v.currency||"JPY"}
                    onPriceChange={val=>setVariant(i,"price",val)}
                    onCurrencyChange={val=>setVariant(i,"currency",val)}
                  />
                </div>
                <div style={{flex:1}}>
                  <label style={lStyle}>重さ（任意）</label>
                  <input placeholder="例: 120g" value={v.weight||""} onChange={e=>setVariant(i,"weight",e.target.value)} style={iStyle}/>
                </div>
                <div style={{flex:1}}>
                  <label style={lStyle}>サイズ（任意）</label>
                  <input placeholder="例: W5×H12cm" value={v.dimensions||""} onChange={e=>setVariant(i,"dimensions",e.target.value)} style={iStyle}/>
                </div>
                {variants.length > 1 && (
                  <button className="btn danger btn-sm" style={{flexShrink:0}} onClick={()=>removeVariant(i)}>×</button>
                )}
              </div>
              {/* 2行目: このサイズの写真 */}
              <div>
                <label style={lStyle}>このサイズの写真（複数追加可）</label>
                <MultiImageUpload
                  images={v.images||[]}
                  onChange={imgs=>setVariant(i,"images",imgs)}
                  folder="products"
                />
              </div>
            </div>
          ))}
        </div>
        <button className="btn secondary btn-sm" style={{marginTop:8}} onClick={addVariant}>+ サイズを追加</button>
      </div>

      {/* 商品メイン画像 */}
      <div className="form-row">
        <ImageUpload value={f.image_url} onChange={v=>set("image_url",v)} folder="products" label="商品メイン画像（サイズに関わらず共通で使う画像）" preview="normal"/>
      </div>

      {/* グラデーション */}
      <div className="form-row cols2">
        <div className="fld">
          <label>カード色①（画像なし時の背景・開始色）</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer",border:"1px solid #E5DDD5",borderRadius:6}}/>
            <input value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{flex:1}}/>
          </div>
        </div>
        <div className="fld">
          <label>カード色②（終了色）</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer",border:"1px solid #E5DDD5",borderRadius:6}}/>
            <input value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{flex:1}}/>
          </div>
        </div>
      </div>
      <div style={{height:32,borderRadius:8,background:`linear-gradient(145deg,${f.color_from},${f.color_to})`,marginBottom:14,border:"1px solid #E5DDD5"}}/>

      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>フレグランスノート</p>
      {["top","mid","base"].map(type=>(
        <div key={type} style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:".1em",color:"#8B7B72",marginBottom:6}}>
            {type==="top"?"TOP ノート":type==="mid"?"MIDDLE ノート":"BASE ノート"}
          </label>
          <div className="note-inputs">
            {notes[type].map((v,i)=>(
              <div className="note-row" key={i}>
                <input placeholder="例: ベルガモット" value={v} onChange={e=>setNote(type,i,e.target.value)}/>
                {notes[type].length>1&&<button className="btn danger btn-sm" onClick={()=>removeNote(type,i)}>×</button>}
              </div>
            ))}
          </div>
          <button className="btn secondary btn-sm" style={{marginTop:6}} onClick={()=>addNote(type)}>+ 追加</button>
        </div>
      ))}

      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>タグ（複数選択可）</p>
      <div className="tag-grid" style={{marginBottom:8}}>
        {(dynamicTags.length > 0 ? dynamicTags : ALL_TAGS).map(t=>(
          <span key={t} className="tag-pill"
            style={{background:selTags.includes(t)?"#C4885A":"#F0EAE3",color:selTags.includes(t)?"#fff":"#8B7B72"}}
            onClick={()=>toggleTag(t)}>{t}</span>
        ))}
      </div>
      {/* カスタムタグ追加 */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <input
          placeholder="新しいタグを入力（例: #タバコ）"
          value={newTagInput}
          onChange={e=>setNewTagInput(e.target.value)}
          onKeyDown={async e=>{
            if (e.key!=="Enter") return;
            e.preventDefault();
            const raw = newTagInput.trim();
            if (!raw) return;
            const name = raw.startsWith("#") ? raw : "#"+raw;
            if (dynamicTags.includes(name)||ALL_TAGS.includes(name)) { setSelTags(p=>p.includes(name)?p:[...p,name]); setNewTagInput(""); return; }
            const { error } = await supabase.from("tags").insert([{ name, category:"scent" }]);
            if (!error) { setDynamicTags(p=>[...p,name]); setSelTags(p=>[...p,name]); }
            setNewTagInput("");
          }}
          style={{flex:1,border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 11px",fontSize:13,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}
        />
        <button className="btn secondary btn-sm" onClick={async ()=>{
          const raw = newTagInput.trim();
          if (!raw) return;
          const name = raw.startsWith("#") ? raw : "#"+raw;
          if (dynamicTags.includes(name)||ALL_TAGS.includes(name)) { setSelTags(p=>p.includes(name)?p:[...p,name]); setNewTagInput(""); return; }
          const { error } = await supabase.from("tags").insert([{ name, category:"scent" }]);
          if (!error) { setDynamicTags(p=>[...p,name]); setSelTags(p=>[...p,name]); }
          setNewTagInput("");
        }}>+ 追加</button>
      </div>

      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>効果・効能（複数選択可）</p>
      <div className="tag-grid" style={{marginBottom:8}}>
        {allEffects.map(e=>(
          <span key={e.id} className="tag-pill"
            style={{background:selEffects.includes(e.id)?"#3D6B48":"#EAF0E8",color:selEffects.includes(e.id)?"#fff":"#3D6B48"}}
            onClick={()=>toggleEffect(e.id)}>{e.name_ja}</span>
        ))}
      </div>
      {/* カスタム効果追加 */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <input
          placeholder="新しい効果を入力（例: 花粉症対策）"
          value={newEffectInput}
          onChange={e=>setNewEffectInput(e.target.value)}
          onKeyDown={async e=>{
            if (e.key!=="Enter") return;
            e.preventDefault();
            const name = newEffectInput.trim();
            if (!name) return;
            const { data, error } = await supabase.from("effects").insert([{ name_ja:name, name_en:name, name_ko:name, name_zh:name, name_fr:name }]).select().single();
            if (!error && data) { setAllEffects(p=>[...p,data]); setSelEffects(p=>[...p,data.id]); }
            setNewEffectInput("");
          }}
          style={{flex:1,border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 11px",fontSize:13,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}
        />
        <button className="btn secondary btn-sm" onClick={async ()=>{
          const name = newEffectInput.trim();
          if (!name) return;
          const { data, error } = await supabase.from("effects").insert([{ name_ja:name, name_en:name, name_ko:name, name_zh:name, name_fr:name }]).select().single();
          if (!error && data) { setAllEffects(p=>[...p,data]); setSelEffects(p=>[...p,data.id]); }
          setNewEffectInput("");
        }}>+ 追加</button>
      </div>

      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>紹介文（各言語）</p>
      <div className="form-row">
        <div className="fld"><label>日本語</label><textarea placeholder="商品の紹介文を入力..." value={f.desc_ja} onChange={e=>set("desc_ja",e.target.value)}/></div>
      </div>
      <div className="form-row cols2">
        <div className="fld"><label>English</label><textarea placeholder="Product description..." value={f.desc_en} onChange={e=>set("desc_en",e.target.value)}/></div>
        <div className="fld"><label>한국어</label><textarea placeholder="제품 설명..." value={f.desc_ko} onChange={e=>set("desc_ko",e.target.value)}/></div>
      </div>
      <div className="form-row cols2">
        <div className="fld"><label>中文</label><textarea placeholder="产品介绍..." value={f.desc_zh} onChange={e=>set("desc_zh",e.target.value)}/></div>
        <div className="fld"><label>Français</label><textarea placeholder="Description du produit..." value={f.desc_fr} onChange={e=>set("desc_fr",e.target.value)}/></div>
      </div>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>成分（公式サイトからコピー）</p>
      <div className="form-row">
        <div className="fld"><label>日本語</label><textarea placeholder="（例）アルコール、水、香料、リモネン..." value={f.ingredients} onChange={e=>set("ingredients",e.target.value)}/></div>
      </div>
      <div className="form-row cols3">
        <div className="fld"><label>English</label><textarea placeholder="ALCOHOL DENAT., AQUA, PARFUM, LIMONENE..." value={f.ingr_en||""} onChange={e=>set("ingr_en",e.target.value)}/></div>
        <div className="fld"><label>한국어</label><textarea placeholder="변성알코올, 정제수, 향료..." value={f.ingr_ko||""} onChange={e=>set("ingr_ko",e.target.value)}/></div>
        <div className="fld"><label>中文</label><textarea placeholder="变性酒精、水、香精..." value={f.ingr_zh||""} onChange={e=>set("ingr_zh",e.target.value)}/></div>
      </div>

      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>購入リンク</p>
      {links.map((l,i)=>(
        <div key={i} style={{background:"#FAF7F3",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
          <div className="form-row cols2" style={{marginBottom:8}}>
            <div className="fld">
              <label>通販サイト</label>
              <select value={l.shop_name} onChange={e=>setLink(i,"shop_name",e.target.value)}>
                {SHOPS.map(s=><option key={s}>{s}</option>)}<option value="other">その他</option>
              </select>
            </div>
            <div className="fld"><label>現在の価格（円）</label><input type="number" placeholder="19800" value={l.current_price} onChange={e=>setLink(i,"current_price",e.target.value)}/></div>
          </div>
          <div className="form-row cols2" style={{marginBottom:0}}>
            <div className="fld"><label>アフィリエイトURL</label><input placeholder="https://..." value={l.url} onChange={e=>setLink(i,"url",e.target.value)}/></div>
            <div className="fld"><label>アフィリエイトコード（メモ用）</label><input placeholder="ASINなど" value={l.affiliate_code} onChange={e=>setLink(i,"affiliate_code",e.target.value)}/></div>
          </div>
          {links.length>1&&<button className="btn danger btn-sm" style={{marginTop:8}} onClick={()=>removeLink(i)}>このリンクを削除</button>}
        </div>
      ))}
      <button className="btn secondary btn-sm" onClick={addLink}>+ 通販サイトを追加</button>
      <div className="sep"/>
      <button className="btn primary" onClick={save} disabled={saving} style={{width:"100%",padding:"12px"}}>
        {saving?(editId?"更新中...":"登録中..."):(editId?"商品を更新する":"商品を登録する")}
      </button>
    </div>
  );
}

function ProductList({ onToast, onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products")
      .select("id,name,type,price,is_published,image_url,brands(name)")
      .order("created_at", { ascending: false });
    setProducts(data||[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const togglePublish = async (id, cur) => {
    await supabase.from("products").update({ is_published:!cur }).eq("id",id);
    onToast(!cur?"公開しました":"非公開にしました");
    load();
  };
  const del = async (id, name) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await supabase.from("products").delete().eq("id",id);
    onToast("削除しました");
    load();
  };

  if (loading) return <div className="card" style={{color:"#8B7B72",fontSize:13}}>読み込み中...</div>;
  if (!products.length) return <div className="card" style={{color:"#8B7B72",fontSize:13}}>まだ商品が登録されていません。</div>;

  return (
    <div className="card" style={{padding:0,overflow:"hidden"}}>
      <table className="tbl">
        <thead>
          <tr><th>画像</th><th>商品名</th><th>ブランド</th><th>種別</th><th>価格</th><th>公開</th><th>操作</th></tr>
        </thead>
        <tbody>
          {products.map(p=>(
            <tr key={p.id}>
              <td>{p.image_url?<img src={p.image_url} style={{width:44,height:44,objectFit:"cover",borderRadius:6}} alt={p.name}/>:<div style={{width:44,height:44,background:"#F0EAE3",borderRadius:6}}/>}</td>
              <td style={{fontWeight:500}}>{p.name}</td>
              <td style={{color:"#8B7B72"}}>{p.brands?.name}</td>
              <td><span className="badge" style={{background:"#F0EAE3",color:"#8B7B72"}}>{p.type}</span></td>
              <td>{p.price?`¥${p.price.toLocaleString()}`:"—"}</td>
              <td><span className="badge" style={{background:p.is_published?"#DCFCE7":"#FEE2E2",color:p.is_published?"#166534":"#991B1B"}}>{p.is_published?"公開中":"非公開"}</span></td>
              <td style={{display:"flex",gap:6}}>
                <button className="btn secondary btn-sm" onClick={()=>onEdit(p.id)}>編集</button>
                <button className="btn secondary btn-sm" onClick={()=>togglePublish(p.id,p.is_published)}>{p.is_published?"非公開に":"公開する"}</button>
                <button className="btn danger btn-sm" onClick={()=>del(p.id,p.name)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [page,   setPage]   = useState("dashboard");
  const [toast,  setToast]  = useState("");
  const [counts, setCounts] = useState({});
  const [editId,  setEditId]  = useState(null);
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const handleEdit = (id) => {
    setEditId(id);
    setPage("product-edit");
  };

  useEffect(()=>{
    Promise.all([
      supabase.from("products").select("*",{count:"exact",head:true}),
      supabase.from("brands").select("*",{count:"exact",head:true}),
      supabase.from("tags").select("*",{count:"exact",head:true}),
    ]).then(([p,b,t])=>setCounts({products:p.count,brands:b.count,tags:t.count}));
  },[]);

  const nav = [["dashboard","ダッシュボード"],["brand-add","ブランド登録"],["product-add","商品登録"],["product-list","商品一覧"]];
  const isEdit = page === "product-edit";
  const titles = { dashboard:"ダッシュボード", "brand-add":"ブランド登録", "product-add":"商品登録", "product-list":"商品一覧", "product-edit":"商品を編集" };

  return (
    <>
      <style>{CSS}</style>
      <div className="adm-wrap">
        <div className="adm-side">
          <div className="adm-logo"><span>Kaorido</span><small>ADMIN PANEL</small></div>
          <div className="adm-nav">
            {nav.map(([id,lbl])=>(<a key={id} className={page===id?"on":""} onClick={()=>setPage(id)}>{lbl}</a>))}
          </div>
        </div>
        <div className="adm-main">
          <div className="adm-head">
            <h1 className="adm-title">{isEdit?"商品を編集":titles[page]}</h1>
            <div style={{display:"flex",gap:8}}>
              {isEdit&&<button className="btn secondary" onClick={()=>{setPage("product-list");setEditId(null);}}>← 一覧に戻る</button>}
              {page==="product-list"&&<button className="btn primary" onClick={()=>{setEditId(null);setPage("product-add");}}>+ 商品を追加</button>}
            </div>
          </div>
          {page==="dashboard"    && <Dashboard counts={counts}/>}
          {page==="brand-add"    && <BrandForm onSave={msg=>{showToast(msg);}}/>}
          {page==="product-add"  && <ProductForm editId={null} onSave={msg=>{showToast(msg);setPage("product-list");}}/>}
          {page==="product-edit" && <ProductForm editId={editId} onSave={msg=>{showToast(msg);setPage("product-list");setEditId(null);}}/>}
          {page==="product-list" && <ProductList onToast={showToast} onEdit={handleEdit}/>}
        </div>
      </div>
      <Toast msg={toast}/>
    </>
  );
}
