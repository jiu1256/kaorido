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
.hist-chip{font-size:11px;padding:2px 9px;border-radius:10px;cursor:pointer;background:#F0EAE3;color:#8B7B72;user-select:none;transition:all .12s;border:none;font-family:inherit;}
.hist-chip:hover{background:#C4885A;color:#fff;}
`;

const DEFAULT_ITEM_TYPES = [
  "香水","ボディミスト","ディフューザー","お香","アロマオイル","ロールオン",
  "アロマキャンドル","ヘアオイル","ヘアミスト","ボディクリーム","柔軟剤",
  "ファブリックミスト","ルームフレグランス","サシェ","バスソルト",
  "ハンドクリーム","ボディウォッシュ","練り香水",
];
const getCustomTypes  = () => { try { return JSON.parse(localStorage.getItem("kaorido_item_types")||"[]"); } catch { return []; } };
const saveCustomTypes = (t) => { localStorage.setItem("kaorido_item_types", JSON.stringify(t)); };

// ── 全履歴関数 ───────────────────────────────────────────
const NOTE_KEY  = "kaorido_notes_history";
const PRICE_KEY = "kaorido_price_history";
const VOL_KEY   = "kaorido_vol_history";
const COLOR_KEY = "kaorido_color_history";

const getNoteHistory  = () => { try { return JSON.parse(localStorage.getItem(NOTE_KEY)||"[]"); } catch { return []; } };
const saveNoteHistory = (name) => {
  if (!name?.trim()) return;
  const h = getNoteHistory().filter(x=>x!==name);
  h.unshift(name); localStorage.setItem(NOTE_KEY, JSON.stringify(h.slice(0,200)));
};
const getPriceHistory  = () => { try { return JSON.parse(localStorage.getItem(PRICE_KEY)||"[]"); } catch { return []; } };
const savePriceHistory = (price) => {
  if (!price) return;
  const h = getPriceHistory().filter(x=>x!==String(price));
  h.unshift(String(price)); localStorage.setItem(PRICE_KEY, JSON.stringify(h.slice(0,30)));
};
const getVolHistory  = () => { try { return JSON.parse(localStorage.getItem(VOL_KEY)||"[]"); } catch { return []; } };
const saveVolHistory = (vol) => {
  if (!vol?.trim()) return;
  const h = getVolHistory().filter(x=>x!==vol);
  h.unshift(vol); localStorage.setItem(VOL_KEY, JSON.stringify(h.slice(0,20)));
};
const getColorHistory  = () => { try { return JSON.parse(localStorage.getItem(COLOR_KEY)||"[]"); } catch { return []; } };
const saveColorHistory = (from, to) => {
  if (!from||!to) return;
  const key = from+"|"+to;
  const h = getColorHistory().filter(x=>x!==key);
  h.unshift(key); localStorage.setItem(COLOR_KEY, JSON.stringify(h.slice(0,16)));
};
const TAG_KEY    = "kaorido_tags_history";
const EFFECT_KEY = "kaorido_effects_history";
const getTagHistory    = () => { try { return JSON.parse(localStorage.getItem(TAG_KEY)||"[]"); } catch { return []; } };
const saveTagHistory   = (name) => { if(!name?.trim())return; const h=getTagHistory().filter(x=>x!==name); h.unshift(name); localStorage.setItem(TAG_KEY,JSON.stringify(h.slice(0,60))); };
const getEffectHistory = () => { try { return JSON.parse(localStorage.getItem(EFFECT_KEY)||"[]"); } catch { return []; } };
const saveEffectHistory= (id) => { if(!id)return; const h=getEffectHistory().filter(x=>x!==id); h.unshift(id); localStorage.setItem(EFFECT_KEY,JSON.stringify(h.slice(0,40))); };

// 履歴チップ共通コンポーネント
function HistChips({ items, onSelect, format }) {
  if (!items.length) return null;
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
      {items.map(v=>(
        <button key={v} className="hist-chip" onClick={()=>onSelect(v)}>
          {format ? format(v) : v}
        </button>
      ))}
    </div>
  );
}

const SHOPS = ["Amazon","楽天市場","Yahoo! ショッピング","公式サイト","Qoo10","ZOZOTOWN","@cosme SHOPPING"];
const DEFAULT_LINKS = [
  { shop_name:"公式サイト",           url:"", affiliate_code:"", current_price:"" },
  { shop_name:"Amazon",              url:"", affiliate_code:"", current_price:"" },
  { shop_name:"楽天市場",             url:"", affiliate_code:"", current_price:"" },
  { shop_name:"Yahoo! ショッピング",  url:"", affiliate_code:"", current_price:"" },
  { shop_name:"Qoo10",               url:"", affiliate_code:"", current_price:"" },
];
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
  "#フローラル","#シトラス","#ウッディ","#グルマン","#フルーティ","#クリーン",
  "#セクシー","#ナチュラル","#パウダリー","#スパイシー","#アクア","#オリエンタル",
  "#ハーバル","#ムスキー","#グリーン","#スモーキー","#レザー","#インセンス",
  "#ベリー","#ミント","#フローラルフルーティ","#シトラスフローラル",
  "#デート","#オフィス","#リラックス","#春夏","#秋冬","#特別な日",
  "#日常","#就寝前","#ヨガ","#読書","#夜","#リビング",
  "#朝","#通勤","#お出かけ","#屋外","#お風呂上がり","#休日",
  "#フェミニン","#ユニセックス","#ラグジュアリー","#カジュアル","#清楚",
  "#エレガント","#和","#明るい","#癒し","#アジアン",
  "#甘い","#さわやか","#個性的","#大人っぽい","#可愛い",
  "#ロマンティック","#華やか","#落ち着き","#初心者向け",
];
const CURRENCIES = [
  { code:"JPY", symbol:"¥",   flag:"🇯🇵" },
  { code:"USD", symbol:"$",   flag:"🇺🇸" },
  { code:"EUR", symbol:"€",   flag:"🇪🇺" },
  { code:"GBP", symbol:"£",   flag:"🇬🇧" },
  { code:"KRW", symbol:"₩",   flag:"🇰🇷" },
  { code:"CNY", symbol:"¥",   flag:"🇨🇳" },
  { code:"CAD", symbol:"CA$", flag:"🇨🇦" },
  { code:"AUD", symbol:"A$",  flag:"🇦🇺" },
  { code:"SEK", symbol:"kr",  flag:"🇸🇪" },
  { code:"CHF", symbol:"CHF", flag:"🇨🇭" },
];

function CurrencyPriceInput({ price, currency, onPriceChange, onCurrencyChange }) {
  const [jpyEquiv,setJpyEquiv]=useState(null);
  const [loading,setLoading]=useState(false);
  const iStyle={border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit",width:"100%"};
  useEffect(()=>{
    if(!price||currency==="JPY"){setJpyEquiv(null);return;}
    const t=setTimeout(async()=>{
      setLoading(true);
      try{const r=await fetch("https://api.frankfurter.app/latest?from="+currency+"&to=JPY");const d=await r.json();if(d.rates?.JPY)setJpyEquiv(Math.round(parseFloat(price)*d.rates.JPY));}catch(e){}
      setLoading(false);
    },600);
    return()=>clearTimeout(t);
  },[price,currency]);
  const cur=CURRENCIES.find(c=>c.code===currency)||CURRENCIES[0];
  return (
    <div>
      <div style={{display:"flex",gap:6}}>
        <select value={currency} onChange={e=>onCurrencyChange(e.target.value)} style={{...iStyle,width:110,flexShrink:0,padding:"7px 6px"}}>
          {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
        </select>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#8B7B72",pointerEvents:"none"}}>{cur.symbol}</span>
          <input type="number" placeholder="例: 19800" value={price} onChange={e=>onPriceChange(e.target.value)} onBlur={e=>savePriceHistory(e.target.value)} style={{...iStyle,paddingLeft:cur.symbol.length>1?36:24}}/>
        </div>
      </div>
      {currency!=="JPY"&&<p style={{fontSize:11,marginTop:5,color:jpyEquiv?"#C4885A":"#B0A098"}}>{loading?"換算中...":jpyEquiv?"≈ ¥"+jpyEquiv.toLocaleString()+" （参考・登録時レート）":price?"円換算を取得中...":"金額を入力すると円換算が表示されます"}</p>}
    </div>
  );
}

function ImageUpload({ value, onChange, folder="products", label="画像", preview="normal" }) {
  const [uploading,setUploading]=useState(false);
  const [localPreview,setLocalPreview]=useState(value||null);
  const inputRef=useRef();
  const handleFile=async(file)=>{
    if(!file||!file.type.startsWith("image/")){alert("画像ファイルを選択してください");return;}
    const reader=new FileReader();reader.onload=(e)=>setLocalPreview(e.target.result);reader.readAsDataURL(file);
    setUploading(true);
    try{
      const ext=file.name.includes(".")?file.name.split(".").pop().toLowerCase():"jpg";
      const safeName=`img_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
      const buf=await file.arrayBuffer();
      const{error:upErr}=await supabase.storage.from("images").upload(safeName,buf,{contentType:file.type,upsert:true});
      if(upErr)throw upErr;
      const{data}=supabase.storage.from("images").getPublicUrl(safeName);
      onChange(data.publicUrl);
    }catch(e){alert("アップロードエラー: "+e.message);setLocalPreview(null);}
    setUploading(false);
  };
  const displaySrc=localPreview||value;
  return (
    <div className="fld">
      <label>{label}</label>
      <div className="img-upload-area" onClick={()=>inputRef.current.click()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}>
        {displaySrc?(
          <><img src={displaySrc} className={preview==="sm"?"img-preview-sm":"img-preview"} alt="preview" style={{margin:"0 auto"}}/><p style={{fontSize:11,color:"#8B7B72"}}>{uploading?"アップロード中...":"クリックまたはドラッグで変更"}</p></>
        ):(
          <><div style={{fontSize:28,marginBottom:6,color:"#C4885A",opacity:.6}}>📷</div><p style={{fontSize:13,color:"#8B7B72",marginBottom:3}}>{uploading?"アップロード中...":"クリックまたはドラッグ＆ドロップ"}</p><p style={{fontSize:11,color:"#B0A098"}}>JPG・PNG・WEBP対応</p></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
    </div>
  );
}

function MultiImageUpload({ images=[], onChange }) {
  const [uploading,setUploading]=useState(false);
  const inputRef=useRef();
  const handleFiles=async(files)=>{
    if(!files?.length)return;setUploading(true);const uploaded=[];
    for(const file of Array.from(files)){
      if(!file.type.startsWith("image/"))continue;
      try{
        const ext=file.name.includes(".")?file.name.split(".").pop().toLowerCase():"jpg";
        const safeName=`img_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
        const buf=await file.arrayBuffer();
        const{error}=await supabase.storage.from("images").upload(safeName,buf,{contentType:file.type,upsert:true});
        if(error)throw error;
        const{data}=supabase.storage.from("images").getPublicUrl(safeName);uploaded.push(data.publicUrl);
      }catch(e){alert("アップロードエラー: "+e.message);}
    }
    onChange([...images,...uploaded]);setUploading(false);
  };
  const remove=(i)=>onChange(images.filter((_,j)=>j!==i));
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
        {images.map((url,i)=>(
          <div key={i} style={{position:"relative",width:60,height:60}}>
            <img src={url} style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #E5DDD5"}} alt=""/>
            <button onClick={()=>remove(i)} style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:"#E05C70",border:"none",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          </div>
        ))}
        <div onClick={()=>inputRef.current.click()} style={{width:60,height:60,border:"2px dashed #E5DDD5",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAF7F3",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#C4885A"} onMouseLeave={e=>e.currentTarget.style.borderColor="#E5DDD5"}>
          <span style={{fontSize:20,color:"#C4885A",opacity:.7}}>{uploading?"…":"+"}</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
    </div>
  );
}

function Toast({msg}){return msg?<div className="toast">{msg}</div>:null;}

function Dashboard({counts}){
  return (
    <div>
      <div className="stat-grid">
        {[["商品数",counts.products],["ブランド数",counts.brands],["タグ数",counts.tags]].map(([l,n])=>(
          <div className="stat" key={l}><div className="stat-n">{n??"—"}</div><div className="stat-l">{l}</div></div>
        ))}
      </div>
      <div className="card"><p style={{fontSize:14,color:"#6B5E55",lineHeight:1.8}}>左メニューから操作してください。<br/><strong style={{color:"#C4885A"}}>ブランド登録</strong>を先に行い、その後<strong style={{color:"#C4885A"}}>商品登録</strong>に進むとスムーズです。</p></div>
    </div>
  );
}

function BrandForm({onSave,editBrandId,onBack}){
  const empty={name:"",abbr:"",color_from:"#F8E6EC",color_to:"#EDD0D8",logo_color:"#8A2040",description_ja:"",official_url:"",logo_url:"",country:"",scent_intro:"",scent_types:[]};
  const [f,setF]=useState(empty);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const editLoadedRef=useRef(null);
  useEffect(()=>{
    if(!editBrandId||editLoadedRef.current===editBrandId)return;
    editLoadedRef.current=editBrandId;
    supabase.from("brands").select("*").eq("id",editBrandId).single().then(({data})=>{
      if(data)setF({...empty,...data,scent_types:data.scent_types||[],scent_intro:data.scent_intro||""});
    });
  },[editBrandId]);
  const save=async()=>{
    if(!f.name.trim())return alert("ブランド名は必須です");
    setSaving(true);
    let error;
    if(editBrandId){({error}=await supabase.from("brands").update(f).eq("id",editBrandId));}
    else{({error}=await supabase.from("brands").upsert([f],{onConflict:"name"}));}
    setSaving(false);
    if(error)return alert("エラー: "+error.message);
    onSave(editBrandId?"ブランドを更新しました":"ブランドを登録しました");
    if(!editBrandId)setF(empty);
  };
  return (
    <div className="card">
      <div className="form-row cols2">
        <div className="fld"><label>ブランド名 *</label><input placeholder="例: Dior" value={f.name} onChange={e=>set("name",e.target.value)}/></div>
        <div className="fld"><label>略称（カード表示用）</label><input placeholder="例: Dior, AdP, YSL" value={f.abbr} onChange={e=>set("abbr",e.target.value)}/></div>
      </div>
      <div className="form-row">
        <div className="fld"><label>国・地域</label>
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
      <div className="form-row"><ImageUpload value={f.logo_url} onChange={v=>set("logo_url",v)} folder="brands" label="ブランドロゴ画像（任意）" preview="sm"/></div>
      <div className="form-row cols3">
        <div className="fld"><label>カード色①</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/><input value={f.color_from} onChange={e=>set("color_from",e.target.value)}/></div></div>
        <div className="fld"><label>カード色②</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/><input value={f.color_to} onChange={e=>set("color_to",e.target.value)}/></div></div>
        <div className="fld"><label>ロゴ文字色</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={f.logo_color} onChange={e=>set("logo_color",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer"}}/><input value={f.logo_color} onChange={e=>set("logo_color",e.target.value)}/></div></div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:".1em",color:"#8B7B72",marginBottom:6}}>カードプレビュー</label>
        <div style={{width:130,borderRadius:10,overflow:"hidden",border:"1px solid #E5DDD5",display:"inline-block"}}>
          <div style={{height:68,background:`linear-gradient(145deg,${f.color_from},${f.color_to})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {f.logo_url?<img src={f.logo_url} style={{width:48,height:48,objectFit:"contain"}} alt="logo"/>:<span style={{fontFamily:"Georgia,serif",fontSize:f.abbr.length>5?11:f.abbr.length>3?14:20,color:f.logo_color,letterSpacing:".12em"}}>{f.abbr||f.name.slice(0,3)||"◈"}</span>}
          </div>
          <div style={{padding:"6px 8px",background:"#fff",textAlign:"center"}}><p style={{fontSize:10,fontWeight:500,color:"#1C1815"}}>{f.name||"ブランド名"}</p></div>
        </div>
      </div>
      <div className="form-row"><div className="fld"><label>ブランド説明（日本語）</label><textarea placeholder="ブランドの説明を入力..." value={f.description_ja} onChange={e=>set("description_ja",e.target.value)}/></div></div>
      <div className="form-row"><div className="fld"><label>公式サイトURL</label><input placeholder="https://www.dior.com" value={f.official_url} onChange={e=>set("official_url",e.target.value)}/></div></div>
      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>香りの特徴・ラインナップ紹介</p>
      <div className="form-row"><div className="fld"><label>香りの全体紹介</label><textarea placeholder="例: SHIROは北海道の自然素材を使い、日常に溶け込むナチュラルな香りが特徴。" value={f.scent_intro||""} onChange={e=>set("scent_intro",e.target.value)} style={{minHeight:80}}/></div></div>
      <div className="fld" style={{marginBottom:14}}>
        <label>香りの種類と解説</label>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:6}}>
          {(f.scent_types||[]).map((st,i)=>(
            <div key={i} style={{background:"#FAF7F3",borderRadius:8,padding:"10px 12px",border:"1px solid #E5DDD5",display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
                <input placeholder="香りの種類名（例: フローラル系）" value={st.name} onChange={e=>set("scent_types",(f.scent_types||[]).map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={{border:"1px solid #E5DDD5",borderRadius:7,padding:"6px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit"}}/>
                <textarea placeholder="この香りの説明" value={st.desc} onChange={e=>set("scent_types",(f.scent_types||[]).map((x,j)=>j===i?{...x,desc:e.target.value}:x))} style={{border:"1px solid #E5DDD5",borderRadius:7,padding:"6px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit",resize:"vertical",minHeight:56,lineHeight:1.6}}/>
              </div>
              <button className="btn danger btn-sm" style={{flexShrink:0,marginTop:2}} onClick={()=>set("scent_types",(f.scent_types||[]).filter((_,j)=>j!==i))}>×</button>
            </div>
          ))}
        </div>
        <button className="btn secondary btn-sm" style={{marginTop:8}} onClick={()=>set("scent_types",[...(f.scent_types||[]),{name:"",desc:""}])}>+ 香りの種類を追加</button>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {editBrandId&&onBack&&<button className="btn secondary" onClick={onBack}>← 一覧に戻る</button>}
        <button className="btn primary" onClick={save} disabled={saving}>{saving?(editBrandId?"更新中...":"登録中..."):(editBrandId?"ブランドを更新":"ブランドを登録")}</button>
      </div>
    </div>
  );
}

function ProductForm({onSave,editId,initialData}){
  const [brands,setBrands]=useState([]);
  const [allEffects,setAllEffects]=useState([]);
  const [dynamicTags,setDynamicTags]=useState([...ALL_TAGS]);
  const [selTags,setSelTags]=useState([]);
  const [selEffects,setSelEffects]=useState([]);
  const [newTagInput,setNewTagInput]=useState("");
  const [newEffectInput,setNewEffectInput]=useState("");
  const [notes,setNotes]=useState({top:[""],mid:[""],base:[""]});
  const [links,setLinks]=useState(DEFAULT_LINKS.map(l=>({...l})));
  const [saving,setSaving]=useState(false);
  const [variants,setVariants]=useState([{volume:"",price:"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
  const [itemTypes,setItemTypes]=useState([...DEFAULT_ITEM_TYPES,...getCustomTypes()]);
  const [newTypeInput,setNewTypeInput]=useState("");
  const [loadingEdit,setLoadingEdit]=useState(false);
  const [bulkNotes,setBulkNotes]=useState("");
  const [bulkNotesMsg,setBulkNotesMsg]=useState("");
  const editLoadedRef=useRef(null);
  const [f,setF]=useState({
    brand_id:"",name:initialData?.name_ja||"",type:initialData?.type||"香水",
    desc_ja:initialData?.desc_ja||"",desc_en:initialData?.desc_en||"",desc_ko:initialData?.desc_ko||"",desc_zh:initialData?.desc_zh||"",desc_fr:"",
    ingredients:initialData?.ingredients||"",ingr_en:initialData?.ingr_en||"",ingr_ko:initialData?.ingr_ko||"",ingr_zh:initialData?.ingr_zh||"",
    color_from:"#FFB3C1",color_to:"#FF8FAB",image_url:"",is_published:true,
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  // initialDataがあればノート・タグも初期化
  useEffect(()=>{
    if(!initialData)return;
    if(initialData.notes_top?.length||initialData.notes_mid?.length||initialData.notes_base?.length){
      setNotes({
        top:initialData.notes_top?.length?initialData.notes_top:[""],
        mid:initialData.notes_mid?.length?initialData.notes_mid:[""],
        base:initialData.notes_base?.length?initialData.notes_base:[""],
      });
    }
    if(initialData.tags?.length)setSelTags(initialData.tags.filter(t=>t.startsWith("#")));
    if(initialData.volume)setVariants([{volume:initialData.volume,price:String(initialData.price||""),currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
  },[]);

  const addVariant=()=>setVariants(p=>[...p,{volume:"",price:"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
  const setVariant=(i,k,v)=>setVariants(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const removeVariant=i=>setVariants(p=>p.filter((_,j)=>j!==i));
  const addNote=type=>setNotes(p=>({...p,[type]:[...p[type],""]}));
  const setNote=(type,i,v)=>setNotes(p=>({...p,[type]:p[type].map((x,j)=>j===i?v:x)}));
  const removeNote=(type,i)=>setNotes(p=>({...p,[type]:p[type].filter((_,j)=>j!==i)}));
  // 一括貼り付け: 「TOP レモン、オレンジ MIDDLE ローズ LAST ムスク」形式の自由テキストを各ノート欄に振り分ける
  const applyBulkNotes=()=>{
    const LABEL_RE=/(TOP|MIDDLE|MID|LAST|BASE|トップ|ミドル|ラスト|ベース)\s*(?:ノート|NOTES?)?\s*[:：]?/gi;
    const tierOf=l=>{const u=l.toUpperCase();if(u==="TOP"||l==="トップ")return"top";if(u==="MIDDLE"||u==="MID"||l==="ミドル")return"mid";return"base";};// LAST/ラスト/BASE/ベース → base
    const matches=[...bulkNotes.matchAll(LABEL_RE)];
    if(matches.length===0){setBulkNotesMsg("⚠ ラベル（TOP/MIDDLE/LAST/BASE/トップ/ミドル/ラスト/ベース）が見つかりません");return;}
    const parsed={};
    matches.forEach((m,idx)=>{
      const tier=tierOf(m[1]);
      const start=m.index+m[0].length;
      const end=idx+1<matches.length?matches[idx+1].index:bulkNotes.length;
      const items=bulkNotes.slice(start,end).split(/[、,，・/\s]+/).map(s=>s.trim()).filter(Boolean);
      if(items.length)parsed[tier]=[...(parsed[tier]||[]),...items];
    });
    if(Object.keys(parsed).length===0){setBulkNotesMsg("⚠ ラベルは見つかりましたが、ノート名がありません");return;}
    setNotes(p=>({...p,...parsed}));
    Object.values(parsed).flat().forEach(saveNoteHistory);
    setBulkNotesMsg("振り分けました: "+["top","mid","base"].filter(t=>parsed[t]).map(t=>`${t.toUpperCase()} ${parsed[t].length}件`).join(" / "));
  };
  const addLink=()=>setLinks(p=>[...p,{shop_name:"Amazon",url:"",affiliate_code:"",current_price:""}]);
  const setLink=(i,k,v)=>setLinks(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const removeLink=i=>setLinks(p=>p.filter((_,j)=>j!==i));
  const toggleTag=t=>{
    saveTagHistory(t);
    setSelTags(p=>p.includes(t)?p.filter(x=>x!==t):[t,...p]);
  };
  const toggleEffect=id=>{
    saveEffectHistory(id);
    setSelEffects(p=>p.includes(id)?p.filter(x=>x!==id):[id,...p]);
  };
  const addItemType=()=>{
    const name=newTypeInput.trim();if(!name||itemTypes.includes(name)){setNewTypeInput("");return;}
    const customs=[...getCustomTypes(),name];saveCustomTypes(customs);
    setItemTypes([...DEFAULT_ITEM_TYPES,...customs]);setF(p=>({...p,type:name}));setNewTypeInput("");
  };

  useEffect(()=>{
    supabase.from("brands").select("id,name").order("name").then(({data})=>setBrands(data||[]));
    supabase.from("effects").select("*").order("name_ja").then(({data})=>{
      if(!data)return;const seen=new Set();
      setAllEffects(data.filter(e=>{if(seen.has(e.name_ja))return false;seen.add(e.name_ja);return true;}));
    });
    supabase.from("tags").select("name").order("name").then(({data})=>{
      if(!data)return;setDynamicTags([...new Set([...ALL_TAGS,...data.map(t=>t.name)])]);
    });
  },[]);

  useEffect(()=>{
    if(!editId||editLoadedRef.current===editId)return;
    editLoadedRef.current=editId;setLoadingEdit(true);
    (async()=>{
      const{data:p}=await supabase.from("products").select("*,fragrance_notes(*),product_tags(tags(name)),product_effects(effect_id),buy_links(*)").eq("id",editId).single();
      if(!p){setLoadingEdit(false);return;}
      const colorMatch=(p.gradient||"").match(/#[0-9A-Fa-f]{6}/g);
      setF({brand_id:p.brand_id||"",name:p.name||"",type:p.type||"香水",desc_ja:p.desc_ja||"",desc_en:p.desc_en||"",desc_ko:p.desc_ko||"",desc_zh:p.desc_zh||"",desc_fr:p.desc_fr||"",ingredients:p.ingredients||"",ingr_en:p.ingr_en||"",ingr_ko:p.ingr_ko||"",ingr_zh:p.ingr_zh||"",color_from:colorMatch?.[0]||"#FFB3C1",color_to:colorMatch?.[1]||"#FF8FAB",image_url:p.image_url||"",is_published:p.is_published??true});
      if(Array.isArray(p.variants)&&p.variants.length>0){setVariants(p.variants);}
      else if(p.price||p.volume){setVariants([{volume:p.volume||"",price:p.price||"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);}
      const noteObj={top:[],mid:[],base:[]};const seenNotes=new Set();
      (p.fragrance_notes||[]).sort((a,b)=>a.display_order-b.display_order).forEach(n=>{
        const key=n.note_type+":"+n.ingredient_name;
        if(noteObj[n.note_type]&&!seenNotes.has(key)){seenNotes.add(key);noteObj[n.note_type].push(n.ingredient_name);}
      });
      setNotes({top:noteObj.top.length?noteObj.top:[""],mid:noteObj.mid.length?noteObj.mid:[""],base:noteObj.base.length?noteObj.base:[""]});
      setSelTags([...new Set((p.product_tags||[]).map(pt=>pt.tags?.name).filter(Boolean))]);
      setSelEffects([...new Set((p.product_effects||[]).map(pe=>pe.effect_id).filter(Boolean))]);
      if((p.buy_links||[]).length>0){
        const seen=new Set();
        setLinks(p.buy_links.filter(l=>{const k=l.shop_name+l.url;if(seen.has(k))return false;seen.add(k);return true;}).map(l=>({shop_name:l.shop_name||"",url:l.url||"",affiliate_code:l.affiliate_code||"",current_price:l.current_price||""})));
      }
      setLoadingEdit(false);
    })();
  },[editId]);

  const save=async()=>{
    if(!f.brand_id)return alert("ブランドを選択してください");
    if(!f.name.trim())return alert("商品名は必須です");
    const validVariants=variants.filter(v=>v.volume.trim()||v.price);
    const toJpy=async(price,currency)=>{
      if(!price)return null;if(currency==="JPY"||!currency)return parseInt(price);
      try{const r=await fetch("https://api.frankfurter.app/latest?from="+currency+"&to=JPY");const d=await r.json();return Math.round(parseFloat(price)*(d.rates?.JPY||1));}catch{return parseInt(price);}
    };
    const jpyPrices=await Promise.all(validVariants.map(v=>toJpy(v.price,v.currency)));
    const variantsWithJpy=validVariants.map((v,i)=>({...v,jpy_price:jpyPrices[i]}));
    const minPrice=jpyPrices.filter(Boolean).length>0?Math.min(...jpyPrices.filter(Boolean)):null;
    const gradient=`linear-gradient(145deg,${f.color_from},${f.color_to})`;
    setSaving(true);
    try{
      const productData={...f,price:minPrice,volume:validVariants.map(v=>v.volume).filter(Boolean).join(" / "),variants:variantsWithJpy,gradient};
      let pid;
      if(editId){
        const{error:e1}=await supabase.from("products").update(productData).eq("id",editId);if(e1)throw e1;pid=editId;
        const delResults=await Promise.all([supabase.from("fragrance_notes").delete().eq("product_id",pid),supabase.from("product_tags").delete().eq("product_id",pid),supabase.from("product_effects").delete().eq("product_id",pid),supabase.from("buy_links").delete().eq("product_id",pid)]);
        const delErrors=delResults.filter(r=>r.error).map(r=>r.error.message);
        if(delErrors.length>0)throw new Error("削除エラー: "+delErrors.join(", "));
      }else{
        const{data:prod,error:e1}=await supabase.from("products").insert([productData]).select().single();if(e1)throw e1;pid=prod.id;
      }
      const noteRows=[];["top","mid","base"].forEach(type=>{notes[type].forEach((name,i)=>{if(name.trim())noteRows.push({product_id:pid,note_type:type,ingredient_name:name.trim(),display_order:i});});});
      if(noteRows.length)await supabase.from("fragrance_notes").insert(noteRows);
      if(selTags.length){const{data:tagRows}=await supabase.from("tags").select("id,name").in("name",selTags);if(tagRows?.length)await supabase.from("product_tags").insert(tagRows.map(t=>({product_id:pid,tag_id:t.id})));}
      if(selEffects.length)await supabase.from("product_effects").insert(selEffects.map(id=>({product_id:pid,effect_id:id})));
      const linkRows=links.filter(l=>l.url.trim()||l.shop_name.trim()).map(l=>({product_id:pid,shop_name:l.shop_name,url:l.url||null,affiliate_code:l.affiliate_code||null,current_price:l.current_price?parseInt(l.current_price):null}));
      if(linkRows.length)await supabase.from("buy_links").insert(linkRows);
      onSave(editId?"商品を更新しました！":"商品を登録しました！");
      if(!editId){
        setF({brand_id:"",name:"",type:"香水",desc_ja:"",desc_en:"",desc_ko:"",desc_zh:"",desc_fr:"",ingredients:"",ingr_en:"",ingr_ko:"",ingr_zh:"",color_from:"#FFB3C1",color_to:"#FF8FAB",image_url:"",is_published:true});
        setVariants([{volume:"",price:"",currency:"JPY",jpy_price:null,weight:"",dimensions:"",images:[]}]);
        setSelTags([]);setSelEffects([]);setNotes({top:[""],mid:[""],base:[""]});setLinks(DEFAULT_LINKS.map(l=>({...l})));
      }
    }catch(e){alert("エラー: "+e.message);}
    setSaving(false);
  };

  if(loadingEdit)return<div className="card" style={{textAlign:"center",padding:"60px 20px",color:"#8B7B72"}}><div style={{fontSize:13}}>データを読み込み中...</div></div>;

  const iStyle={width:"100%",border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 10px",fontSize:13,background:"#fff",outline:"none",fontFamily:"inherit"};
  const lStyle={fontSize:10,fontWeight:600,letterSpacing:".1em",color:"#B0A098",display:"block",marginBottom:4};

  const addNoteFromHistory = (type, name) => {
    setNotes(p => {
      if (p[type].includes(name)) return p;
      const filtered = p[type].filter(Boolean);
      return {...p, [type]: [name, ...filtered]};
    });
  };

  const NoteHistoryChips = ({type}) => {
    const history = getNoteHistory();
    if (!history.length) return null;
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8,padding:"7px 10px",background:"#FAF7F3",borderRadius:7,border:"1px solid #E5DDD5"}}>
        <span style={{fontSize:10,fontWeight:600,color:"#B0A098",marginRight:2,alignSelf:"center"}}>履歴：</span>
        {history.slice(0,40).map(name => (
          <span key={name}
            onClick={() => addNoteFromHistory(type, name)}
            style={{fontSize:11,padding:"2px 9px",borderRadius:10,cursor:"pointer",background:"#F0EAE3",color:"#8B7B72",userSelect:"none",transition:"all .12s"}}
            onMouseEnter={e => { e.currentTarget.style.background="#C4885A"; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#F0EAE3"; e.currentTarget.style.color="#8B7B72"; }}>
            {name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>基本情報</p>
      <div className="form-row cols2">
        <div className="fld"><label>ブランド *</label>
          <select value={f.brand_id} onChange={e=>set("brand_id",e.target.value)}>
            <option value="">選択してください</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="fld"><label>アイテム種別 *</label>
          <select value={f.type} onChange={e=>set("type",e.target.value)}>{itemTypes.map(t=><option key={t}>{t}</option>)}</select>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <input placeholder="新しい種別" value={newTypeInput} onChange={e=>setNewTypeInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItemType()} style={{flex:1,border:"1px solid #E5DDD5",borderRadius:6,padding:"5px 9px",fontSize:12,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}/>
            <button className="btn secondary btn-sm" onClick={addItemType}>+ 追加</button>
          </div>
        </div>
      </div>
      <div className="form-row cols2">
        <div className="fld"><label>商品名 *</label><input placeholder="例: チャンス オー タンドル" value={f.name} onChange={e=>set("name",e.target.value)}/></div>
        <div className="fld"><label>公開設定</label>
          <select value={f.is_published} onChange={e=>set("is_published",e.target.value==="true")}>
            <option value="true">公開</option><option value="false">非公開（下書き）</option>
          </select>
        </div>
      </div>

      {/* 容量・価格 */}
      <div className="fld" style={{marginBottom:14}}>
        <label>容量・価格・サイズ（複数ある場合は追加）</label>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:6}}>
          {variants.map((v,i)=>(
            <div key={i} style={{background:"#FAF7F3",borderRadius:8,padding:"12px 14px",border:"1px solid #E5DDD5"}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:10}}>
                {/* 容量 + 履歴 */}
                <div style={{flex:1}}>
                  <label style={lStyle}>容量</label>
                  <HistChips items={getVolHistory()} onSelect={vol=>setVariant(i,"volume",vol)}/>
                  <input placeholder="例: 50ml" value={v.volume} onChange={e=>setVariant(i,"volume",e.target.value)} onBlur={e=>saveVolHistory(e.target.value)} style={iStyle}/>
                </div>
                {/* 価格 + 履歴 */}
                <div style={{flex:2,minWidth:0}}>
                  <label style={lStyle}>価格・通貨</label>
                  <HistChips items={getPriceHistory()} onSelect={p=>setVariant(i,"price",p)} format={p=>"¥"+Number(p).toLocaleString()}/>
                  <CurrencyPriceInput price={v.price} currency={v.currency||"JPY"} onPriceChange={val=>setVariant(i,"price",val)} onCurrencyChange={val=>setVariant(i,"currency",val)}/>
                </div>
                <div style={{flex:1}}><label style={lStyle}>重さ（任意）</label><input placeholder="例: 120g" value={v.weight||""} onChange={e=>setVariant(i,"weight",e.target.value)} style={iStyle}/></div>
                <div style={{flex:1}}><label style={lStyle}>サイズ（任意）</label><input placeholder="例: W5×H12cm" value={v.dimensions||""} onChange={e=>setVariant(i,"dimensions",e.target.value)} style={iStyle}/></div>
                {variants.length>1&&<button className="btn danger btn-sm" style={{flexShrink:0}} onClick={()=>removeVariant(i)}>×</button>}
              </div>
              <div><label style={lStyle}>このサイズの写真（複数追加可）</label><MultiImageUpload images={v.images||[]} onChange={imgs=>setVariant(i,"images",imgs)}/></div>
            </div>
          ))}
        </div>
        <button className="btn secondary btn-sm" style={{marginTop:8}} onClick={addVariant}>+ サイズを追加</button>
      </div>

      <div className="form-row"><ImageUpload value={f.image_url} onChange={v=>set("image_url",v)} folder="products" label="商品メイン画像（サイズ共通）" preview="normal"/></div>
      <div className="form-row cols2">
        <div className="fld"><label>カード色①</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer",border:"1px solid #E5DDD5",borderRadius:6}}/><input value={f.color_from} onChange={e=>set("color_from",e.target.value)} style={{flex:1}}/></div></div>
        <div className="fld"><label>カード色②</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{width:44,height:36,padding:2,cursor:"pointer",border:"1px solid #E5DDD5",borderRadius:6}}/><input value={f.color_to} onChange={e=>set("color_to",e.target.value)} style={{flex:1}}/></div></div>
      </div>
      {/* カラー履歴 */}
      {getColorHistory().length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
          <span style={{fontSize:10,color:"#B0A098",alignSelf:"center",marginRight:2}}>カラー履歴：</span>
          {getColorHistory().map(key=>{const [cf,ct]=key.split("|");return(
            <div key={key} onClick={()=>{set("color_from",cf);set("color_to",ct);}} title={cf+" → "+ct}
              style={{width:36,height:20,borderRadius:4,background:`linear-gradient(145deg,${cf},${ct})`,cursor:"pointer",border:"1px solid #E5DDD5",transition:"transform .12s",flexShrink:0}}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
          );})}
        </div>
      )}
      <div style={{height:32,borderRadius:8,background:`linear-gradient(145deg,${f.color_from},${f.color_to})`,marginBottom:14,border:"1px solid #E5DDD5"}} onMouseLeave={()=>saveColorHistory(f.color_from,f.color_to)}/>

      {/* フレグランスノート */}
      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>フレグランスノート</p>
      {/* 一括貼り付け */}
      <div style={{marginBottom:14}}>
        <textarea value={bulkNotes} onChange={e=>setBulkNotes(e.target.value)} rows={2}
          placeholder="一括貼り付け 例: TOP レモン、オレンジ MIDDLE ローズ LAST ムスク"
          style={{width:"100%",fontSize:12,padding:8,border:"1px solid #E5DDD5",borderRadius:6,resize:"vertical",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:4,flexWrap:"wrap"}}>
          <button className="btn secondary btn-sm" onClick={applyBulkNotes}>ノートに振り分け</button>
          <span style={{fontSize:10,color:"#B0A098"}}>TOP/MIDDLE/LAST/BASE・トップ/ミドル/ラスト/ベースを検出（LASTはBASE扱い）。区切りは読点・カンマ・中黒・スペース</span>
        </div>
        {bulkNotesMsg&&<p style={{fontSize:11,color:"#8B7B72",marginTop:4}}>{bulkNotesMsg}</p>}
      </div>
      {["top","mid","base"].map(type=>(
        <div key={type} style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:".1em",color:"#8B7B72",marginBottom:6}}>{type==="top"?"TOP ノート":type==="mid"?"MIDDLE ノート":"BASE ノート"}</label>
          <NoteHistoryChips type={type}/>
          <div className="note-inputs">
            {notes[type].map((v,i)=>(
              <div className="note-row" key={i}>
                <input placeholder="例: ベルガモット" value={v} onChange={e=>setNote(type,i,e.target.value)} onBlur={e=>saveNoteHistory(e.target.value)} list={`note-hist-${type}`}/>
                {notes[type].length>1&&<button className="btn danger btn-sm" onClick={()=>removeNote(type,i)}>×</button>}
              </div>
            ))}
          </div>
          <datalist id={`note-hist-${type}`}>{getNoteHistory().filter(h=>!notes[type].includes(h)).slice(0,20).map(h=><option key={h} value={h}/>)}</datalist>
          <button className="btn secondary btn-sm" style={{marginTop:6}} onClick={()=>addNote(type)}>+ 追加</button>
        </div>
      ))}

      {/* タグ */}
      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>タグ（複数選択可）</p>
      {(()=>{
        const tagHist=getTagHistory();
        const sorted=[...tagHist.filter(t=>dynamicTags.includes(t)),...dynamicTags.filter(t=>!tagHist.includes(t))];
        return(
          <>
            {tagHist.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8,padding:"7px 10px",background:"#FAF7F3",borderRadius:7,border:"1px solid #E5DDD5"}}>
                <span style={{fontSize:10,fontWeight:600,color:"#B0A098",marginRight:2,alignSelf:"center"}}>履歴：</span>
                {tagHist.slice(0,40).map(t=>(
                  <span key={t} onClick={()=>toggleTag(t)}
                    style={{fontSize:11,padding:"2px 9px",borderRadius:10,cursor:"pointer",background:selTags.includes(t)?"#C4885A":"#F0EAE3",color:selTags.includes(t)?"#fff":"#8B7B72",userSelect:"none",transition:"all .12s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#C4885A";e.currentTarget.style.color="#fff";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=selTags.includes(t)?"#C4885A":"#F0EAE3";e.currentTarget.style.color=selTags.includes(t)?"#fff":"#8B7B72";}}>{t}</span>
                ))}
              </div>
            )}
            <div className="tag-grid" style={{marginBottom:8}}>
              {sorted.map(t=><span key={t} className="tag-pill" style={{background:selTags.includes(t)?"#C4885A":"#F0EAE3",color:selTags.includes(t)?"#fff":"#8B7B72"}} onClick={()=>toggleTag(t)}>{t}</span>)}
            </div>
          </>
        );
      })()}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <input placeholder="新タグを追加（例: #タバコ）　Enterで確定" value={newTagInput} onChange={e=>setNewTagInput(e.target.value)}
          onKeyDown={async e=>{
            if(e.key!=="Enter")return;e.preventDefault();
            const raw=newTagInput.trim();if(!raw)return;
            const name=raw.startsWith("#")?raw:"#"+raw;
            if(!dynamicTags.includes(name)){
              const{error}=await supabase.from("tags").upsert([{name,category:"custom"}],{onConflict:"name"});
              if(!error)setDynamicTags(p=>[name,...p.filter(x=>x!==name)]);
            }
            saveTagHistory(name);
            setSelTags(p=>p.includes(name)?p:[name,...p]);
            setNewTagInput("");
          }}
          style={{flex:1,border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 11px",fontSize:13,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}/>
        <button className="btn secondary btn-sm" onClick={async()=>{
          const raw=newTagInput.trim();if(!raw)return;
          const name=raw.startsWith("#")?raw:"#"+raw;
          if(!dynamicTags.includes(name)){
            const{error}=await supabase.from("tags").upsert([{name,category:"custom"}],{onConflict:"name"});
            if(!error)setDynamicTags(p=>[name,...p.filter(x=>x!==name)]);
          }
          saveTagHistory(name);
          setSelTags(p=>p.includes(name)?p:[name,...p]);
          setNewTagInput("");
        }}>+ 追加</button>
      </div>

      {/* 効果効能 */}
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>効果・効能（複数選択可）</p>
      {(()=>{
        const effHist=getEffectHistory();
        const sorted=[...effHist.map(id=>allEffects.find(e=>e.id===id)).filter(Boolean),...allEffects.filter(e=>!effHist.includes(e.id))];
        return(
          <>
            {effHist.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8,padding:"7px 10px",background:"#EAF0E8",borderRadius:7,border:"1px solid #C8DCC4"}}>
                <span style={{fontSize:10,fontWeight:600,color:"#3D6B48",marginRight:2,alignSelf:"center"}}>履歴：</span>
                {effHist.map(id=>{const e=allEffects.find(x=>x.id===id);if(!e)return null;return(
                  <span key={id} onClick={()=>toggleEffect(id)}
                    style={{fontSize:11,padding:"2px 9px",borderRadius:10,cursor:"pointer",background:selEffects.includes(id)?"#3D6B48":"#C8DCC4",color:selEffects.includes(id)?"#fff":"#3D6B48",userSelect:"none",transition:"all .12s"}}
                    onMouseEnter={ev=>{ev.currentTarget.style.background="#3D6B48";ev.currentTarget.style.color="#fff";}}
                    onMouseLeave={ev=>{ev.currentTarget.style.background=selEffects.includes(id)?"#3D6B48":"#C8DCC4";ev.currentTarget.style.color=selEffects.includes(id)?"#fff":"#3D6B48";}}>{e.name_ja}</span>
                );})}
              </div>
            )}
            <div className="tag-grid" style={{marginBottom:8}}>
              {sorted.map(e=><span key={e.id} className="tag-pill" style={{background:selEffects.includes(e.id)?"#3D6B48":"#EAF0E8",color:selEffects.includes(e.id)?"#fff":"#3D6B48"}} onClick={()=>toggleEffect(e.id)}>{e.name_ja}</span>)}
            </div>
          </>
        );
      })()}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <input placeholder="新しい効果を追加（例: 花粉症対策）　Enterで確定" value={newEffectInput} onChange={e=>setNewEffectInput(e.target.value)}
          onKeyDown={async e=>{if(e.key!=="Enter")return;e.preventDefault();const name=newEffectInput.trim();if(!name)return;if(allEffects.some(x=>x.name_ja===name)){setNewEffectInput("");return;}const{data,error}=await supabase.from("effects").insert([{name_ja:name,name_en:name,name_ko:name,name_zh:name,name_fr:name}]).select().single();if(!error&&data){setAllEffects(p=>[data,...p]);saveEffectHistory(data.id);setSelEffects(p=>[data.id,...p]);}setNewEffectInput("");}}
          style={{flex:1,border:"1px solid #E5DDD5",borderRadius:7,padding:"7px 11px",fontSize:13,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}/>
        <button className="btn secondary btn-sm" onClick={async()=>{const name=newEffectInput.trim();if(!name)return;if(allEffects.some(x=>x.name_ja===name)){setNewEffectInput("");return;}const{data,error}=await supabase.from("effects").insert([{name_ja:name,name_en:name,name_ko:name,name_zh:name,name_fr:name}]).select().single();if(!error&&data){setAllEffects(p=>[data,...p]);saveEffectHistory(data.id);setSelEffects(p=>[data.id,...p]);}setNewEffectInput("");}}>+ 追加</button>
      </div>

      {/* 紹介文 */}
      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>紹介文（各言語）</p>
      <div className="form-row"><div className="fld"><label>日本語</label><textarea placeholder="商品の紹介文を入力..." value={f.desc_ja} onChange={e=>set("desc_ja",e.target.value)}/></div></div>
      <div className="form-row cols2">
        <div className="fld"><label>English</label><textarea placeholder="Product description..." value={f.desc_en} onChange={e=>set("desc_en",e.target.value)}/></div>
        <div className="fld"><label>한국어</label><textarea placeholder="제품 설명..." value={f.desc_ko} onChange={e=>set("desc_ko",e.target.value)}/></div>
      </div>
      <div className="form-row"><div className="fld"><label>中文</label><textarea placeholder="产品介绍..." value={f.desc_zh} onChange={e=>set("desc_zh",e.target.value)}/></div></div>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:8}}>成分（公式サイトからコピー）</p>
      <div className="form-row"><div className="fld"><label>日本語</label><textarea placeholder="（例）アルコール、水、香料..." value={f.ingredients} onChange={e=>set("ingredients",e.target.value)}/></div></div>
      <div className="form-row cols3">
        <div className="fld"><label>English</label><textarea placeholder="ALCOHOL DENAT., AQUA, PARFUM..." value={f.ingr_en||""} onChange={e=>set("ingr_en",e.target.value)}/></div>
        <div className="fld"><label>한국어</label><textarea placeholder="변성알코올, 정제수, 향료..." value={f.ingr_ko||""} onChange={e=>set("ingr_ko",e.target.value)}/></div>
        <div className="fld"><label>中文</label><textarea placeholder="变性酒精、水、香精..." value={f.ingr_zh||""} onChange={e=>set("ingr_zh",e.target.value)}/></div>
      </div>

      {/* 購入リンク */}
      <div className="sep"/>
      <p style={{fontSize:12,fontWeight:700,letterSpacing:".15em",color:"#B0A098",marginBottom:12}}>購入リンク</p>
      {links.map((l,i)=>(
        <div key={i} style={{background:"#FAF7F3",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
          <div className="form-row cols2" style={{marginBottom:8}}>
            <div className="fld"><label>通販サイト</label>
              {l._other?(
                <div style={{display:"flex",gap:6}}>
                  <input placeholder="サイト名を入力（例: ZOZOTOWN）" value={l.shop_name} onChange={e=>setLink(i,"shop_name",e.target.value)} style={{flex:1}}/>
                  <button className="btn secondary btn-sm" onClick={()=>setLinks(p=>p.map((x,j)=>j===i?{...x,_other:false}:x))}>▼</button>
                </div>
              ):(
                <select value={SHOPS.includes(l.shop_name)?l.shop_name:l.shop_name?"other":""}
                  onChange={e=>{if(e.target.value==="other")setLinks(p=>p.map((x,j)=>j===i?{...x,shop_name:"",_other:true}:x));else setLink(i,"shop_name",e.target.value);}}>
                  <option value="">選択してください</option>
                  {SHOPS.map(s=><option key={s}>{s}</option>)}
                  <option value="other">その他（自由入力）</option>
                </select>
              )}
            </div>
            <div className="fld"><label>現在の価格（円）</label>
              <HistChips items={getPriceHistory()} onSelect={p=>setLink(i,"current_price",p)} format={p=>"¥"+Number(p).toLocaleString()}/>
              <input type="number" placeholder="19800" value={l.current_price} onChange={e=>setLink(i,"current_price",e.target.value)} onBlur={e=>savePriceHistory(e.target.value)}/>
            </div>
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

function AIImportForm({onResult}){
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const apiKey=import.meta.env.VITE_ANTHROPIC_API_KEY;

  const generate=async()=>{
    if(!url.trim())return alert("URLを入力してください");
    if(!apiKey)return alert(".envにVITE_ANTHROPIC_API_KEYを追加してください\n例: VITE_ANTHROPIC_API_KEY=sk-ant-...");
    const cleanKey=apiKey.trim().replace(/[^\x00-\x7F]/g,"");
    if(!cleanKey.startsWith("sk-ant-"))return alert("APIキーが正しくありません。\nsk-ant- で始まるキーを.envに設定してください。\n現在の値: "+apiKey.slice(0,30)+"...");
    setLoading(true);setError("");setResult(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":cleanKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:3000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`以下のフレグランス商品ページのURLを分析して、商品情報をJSONのみで返してください。説明不要。

URL: ${url}

返すJSON（必ずこの形式のみ）:
{"name_ja":"日本語商品名","name_en":"英語名","brand":"ブランド名","type":"香水","volume":"50ml","price":12000,"notes_top":["ノート1"],"notes_mid":["ノート1"],"notes_base":["ノート1"],"tags":["#フローラル"],"effects":["リラックス効果"],"desc_ja":"日本語説明100文字","desc_en":"English 100chars","desc_ko":"한국어 100자","desc_zh":"中文100字","ingredients":"日本語成分","ingr_en":"English ingredients","ingr_ko":"한국어 성분","ingr_zh":"中文成分"}`}]
        })
      });
      const data=await res.json();
      const text=data.content?.filter(c=>c.type==="text").map(c=>c.text).join("");
      const jsonMatch=text.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error("JSON形式で返ってきませんでした。もう一度試してください。");
      setResult(JSON.parse(jsonMatch[0]));
    }catch(e){setError("エラー: "+e.message);}
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <p style={{fontSize:13,color:"#6B5E55",lineHeight:1.7,marginBottom:12}}>
          商品ページのURLを入力すると、AIが商品名・ノート・タグ・説明文（4言語）・成分を自動生成して商品登録フォームに反映します。
        </p>
        {!apiKey&&<p style={{fontSize:12,background:"#FEF3C7",color:"#92400E",padding:"8px 12px",borderRadius:6,marginBottom:12}}>⚠ .envに VITE_ANTHROPIC_API_KEY を追加してください</p>}
        <div style={{display:"flex",gap:8}}>
          <input placeholder="https://shiro-shiro.jp/ec/Item/..." value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}
            style={{flex:1,border:"1px solid #E5DDD5",borderRadius:7,padding:"8px 11px",fontSize:13,background:"#FAF7F3",outline:"none",fontFamily:"inherit"}}/>
          <button className="btn primary" onClick={generate} disabled={loading||!apiKey}>{loading?"⏳ 生成中...":"✨ AI生成"}</button>
        </div>
        {error&&<p style={{fontSize:12,color:"#991B1B",marginTop:10,padding:"8px 12px",background:"#FEE2E2",borderRadius:6}}>{error}</p>}
      </div>
      {result&&(
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontSize:13,fontWeight:500,color:"#166534"}}>✅ 生成完了！内容を確認して「商品登録に使う」を押してください</p>
            <button className="btn primary" onClick={()=>onResult(result)}>商品登録に使う →</button>
          </div>
          <div style={{background:"#FAF7F3",borderRadius:8,padding:"12px 14px",fontSize:12,lineHeight:2,border:"1px solid #E5DDD5"}}>
            <p><strong>商品名（日）：</strong>{result.name_ja}</p>
            <p><strong>商品名（英）：</strong>{result.name_en}</p>
            <p><strong>ブランド：</strong>{result.brand}　<strong>種別：</strong>{result.type}　<strong>価格：</strong>¥{result.price?.toLocaleString()}　<strong>容量：</strong>{result.volume}</p>
            <p><strong>TOP：</strong>{result.notes_top?.join(", ") || "—"}</p>
            <p><strong>MID：</strong>{result.notes_mid?.join(", ") || "—"}</p>
            <p><strong>BASE：</strong>{result.notes_base?.join(", ") || "—"}</p>
            <p><strong>タグ：</strong>{result.tags?.join(" ") || "—"}</p>
            <p><strong>説明（日）：</strong>{result.desc_ja}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BrandList({onToast,onEdit}){
  const [brands,setBrands]=useState([]);const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);const{data}=await supabase.from("brands").select("*").order("name");setBrands(data||[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const del=async(id,name)=>{if(!confirm(`「${name}」を削除しますか？`))return;const{error}=await supabase.from("brands").delete().eq("id",id);if(error){alert(`削除できませんでした。\n\nSupabaseでDELETEポリシーを追加してください:\nCREATE POLICY "anon delete brands" ON brands FOR DELETE TO anon USING (TRUE);`);return;}onToast("削除しました");load();};
  if(loading)return<div className="card" style={{color:"#8B7B72",fontSize:13}}>読み込み中...</div>;
  if(!brands.length)return<div className="card" style={{color:"#8B7B72",fontSize:13}}>まだブランドが登録されていません。</div>;
  return (
    <div className="card" style={{padding:0,overflow:"hidden"}}>
      <table className="tbl">
        <thead><tr><th>ロゴ</th><th>ブランド名</th><th>略称</th><th>国</th><th>操作</th></tr></thead>
        <tbody>
          {brands.map(b=>(
            <tr key={b.id}>
              <td><div style={{width:44,height:44,borderRadius:7,background:`linear-gradient(145deg,${b.color_from||"#F8E6EC"},${b.color_to||"#EDD0D8"})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {b.logo_url?<img src={b.logo_url} style={{width:"100%",height:"100%",objectFit:"contain",padding:4}} alt=""/>:<span style={{fontFamily:"Georgia,serif",fontSize:b.abbr?.length>3?11:14,color:b.logo_color||"#8A2040"}}>{b.abbr||b.name?.slice(0,2)||"◈"}</span>}
              </div></td>
              <td style={{fontWeight:500}}>{b.name}</td>
              <td style={{color:"#8B7B72"}}>{b.abbr||"—"}</td>
              <td style={{color:"#8B7B72"}}>{b.country||"—"}</td>
              <td style={{display:"flex",gap:6}}>
                <button className="btn secondary btn-sm" onClick={()=>onEdit(b.id)}>編集</button>
                <button className="btn danger btn-sm" onClick={()=>del(b.id,b.name)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductList({onToast,onEdit,onDuplicate}){
  const [products,setProducts]=useState([]);const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);const{data}=await supabase.from("products").select("id,name,type,price,is_published,image_url,brands(name)").order("created_at",{ascending:false});setProducts(data||[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const togglePublish=async(id,cur)=>{await supabase.from("products").update({is_published:!cur}).eq("id",id);onToast(!cur?"公開しました":"非公開にしました");load();};
  const del=async(id,name)=>{if(!confirm(`「${name}」を削除しますか？`))return;await supabase.from("products").delete().eq("id",id);onToast("削除しました");load();};
  if(loading)return<div className="card" style={{color:"#8B7B72",fontSize:13}}>読み込み中...</div>;
  if(!products.length)return<div className="card" style={{color:"#8B7B72",fontSize:13}}>まだ商品が登録されていません。</div>;
  return (
    <div className="card" style={{padding:0,overflow:"hidden"}}>
      <table className="tbl">
        <thead><tr><th>画像</th><th>商品名</th><th>ブランド</th><th>種別</th><th>価格</th><th>公開</th><th>操作</th></tr></thead>
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
                <button className="btn secondary btn-sm" onClick={()=>onDuplicate(p.id)}>複製</button>
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

export default function Admin(){
  const [page,setPage]=useState("dashboard");
  const [toast,setToast]=useState("");
  const [counts,setCounts]=useState({});
  const [editId,setEditId]=useState(null);
  const [editBrandId,setEditBrandId]=useState(null);
  const [aiData,setAiData]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500);};
  const handleEdit=(id)=>{setEditId(id);setPage("product-edit");};
  const handleBrandEdit=(id)=>{setEditBrandId(id);setPage("brand-edit");};
  const handleAIResult=(data)=>{setAiData(data);setEditId(null);setPage("product-add");};
  const handleDuplicate=async(id)=>{
    if(!confirm("この商品を複製しますか？"))return;
    const{data:src}=await supabase.from("products").select("*,fragrance_notes(*),product_tags(tag_id),product_effects(effect_id),buy_links(*)").eq("id",id).single();
    if(!src)return;
    const{data:newProd,error}=await supabase.from("products").insert([{brand_id:src.brand_id,name:src.name+"（コピー）",type:src.type,price:src.price,volume:src.volume,variants:src.variants,gradient:src.gradient,color_from:src.color_from,color_to:src.color_to,image_url:src.image_url,desc_ja:src.desc_ja,desc_en:src.desc_en,desc_ko:src.desc_ko,desc_zh:src.desc_zh,desc_fr:src.desc_fr,ingredients:src.ingredients,ingr_en:src.ingr_en,ingr_ko:src.ingr_ko,ingr_zh:src.ingr_zh,is_published:false}]).select().single();
    if(error){alert("複製エラー: "+error.message);return;}
    const pid=newProd.id;
    const noteRows=(src.fragrance_notes||[]).map(n=>({product_id:pid,note_type:n.note_type,ingredient_name:n.ingredient_name,display_order:n.display_order}));
    if(noteRows.length)await supabase.from("fragrance_notes").insert(noteRows);
    const tagRows=(src.product_tags||[]).map(t=>({product_id:pid,tag_id:t.tag_id}));
    if(tagRows.length)await supabase.from("product_tags").insert(tagRows);
    const effRows=(src.product_effects||[]).map(e=>({product_id:pid,effect_id:e.effect_id}));
    if(effRows.length)await supabase.from("product_effects").insert(effRows);
    const linkRows=(src.buy_links||[]).map(l=>({product_id:pid,shop_name:l.shop_name,url:l.url,current_price:l.current_price,affiliate_code:l.affiliate_code}));
    if(linkRows.length)await supabase.from("buy_links").insert(linkRows);
    showToast("複製しました！編集画面で確認してください");
    setEditId(pid);setPage("product-edit");
  };
  useEffect(()=>{
    Promise.all([supabase.from("products").select("*",{count:"exact",head:true}),supabase.from("brands").select("*",{count:"exact",head:true}),supabase.from("tags").select("*",{count:"exact",head:true})]).then(([p,b,t])=>setCounts({products:p.count,brands:b.count,tags:t.count}));
  },[]);
  const nav=[["dashboard","ダッシュボード"],["brand-add","ブランド登録"],["brand-list","ブランド一覧"],["product-add","商品登録"],["product-list","商品一覧"],["ai-import","✨ AI商品登録"]];
  const isEdit=page==="product-edit";const isBrandEdit=page==="brand-edit";
  const titles={dashboard:"ダッシュボード","brand-add":"ブランド登録","brand-list":"ブランド一覧","product-add":"商品登録","product-list":"商品一覧","product-edit":"商品を編集","brand-edit":"ブランドを編集","ai-import":"AI商品登録"};
  return (
    <>
      <style>{CSS}</style>
      <div className="adm-wrap">
        <div className="adm-side">
          <div className="adm-logo"><span>Kaorido</span><small>ADMIN PANEL</small></div>
          <div className="adm-nav">{nav.map(([id,lbl])=>(<a key={id} className={page===id?"on":""} onClick={()=>setPage(id)}>{lbl}</a>))}</div>
        </div>
        <div className="adm-main">
          <div className="adm-head">
            <h1 className="adm-title">{isEdit?"商品を編集":isBrandEdit?"ブランドを編集":titles[page]}</h1>
            <div style={{display:"flex",gap:8}}>
              {isEdit&&<button className="btn secondary" onClick={()=>{setPage("product-list");setEditId(null);}}>← 一覧に戻る</button>}
              {isBrandEdit&&<button className="btn secondary" onClick={()=>{setPage("brand-list");setEditBrandId(null);}}>← 一覧に戻る</button>}
              {page==="product-list"&&<button className="btn primary" onClick={()=>{setEditId(null);setAiData(null);setPage("product-add");}}>+ 商品を追加</button>}
              {page==="brand-list"&&<button className="btn primary" onClick={()=>{setEditBrandId(null);setPage("brand-add");}}>+ ブランドを追加</button>}
            </div>
          </div>
          {page==="dashboard"    && <Dashboard counts={counts}/>}
          {page==="brand-add"    && <BrandForm onSave={msg=>{showToast(msg);}}/>}
          {page==="brand-list"   && <BrandList onToast={showToast} onEdit={handleBrandEdit}/>}
          {page==="brand-edit"   && <BrandForm editBrandId={editBrandId} onSave={msg=>{showToast(msg);setPage("brand-list");setEditBrandId(null);}} onBack={()=>{setPage("brand-list");setEditBrandId(null);}}/>}
          {page==="product-add"  && <ProductForm editId={null} initialData={aiData} onSave={msg=>{showToast(msg);setPage("product-list");setAiData(null);}}/>}
          {page==="product-edit" && <ProductForm editId={editId} onSave={msg=>{showToast(msg);setPage("product-list");setEditId(null);}}/>}
          {page==="product-list" && <ProductList onToast={showToast} onEdit={handleEdit} onDuplicate={handleDuplicate}/>}
          {page==="ai-import"    && <AIImportForm onResult={handleAIResult}/>}
        </div>
      </div>
      <Toast msg={toast}/>
    </>
  );
}
