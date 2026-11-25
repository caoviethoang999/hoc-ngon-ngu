/* Bộ chia động từ tiếng Hàn (từ trang Ngữ pháp và từ vựng tiếng Hàn) */
window.HG = (() => {
  const BASE = 0xAC00;
  const LJ = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const VJ = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const TJ = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const dec = ch => { const c = ch.charCodeAt(0) - BASE; return {l: Math.floor(c / 588), v: Math.floor(c % 588 / 28), t: c % 28}; };
  const com = (l, v, t) => String.fromCharCode(BASE + (l * 21 + v) * 28 + (t || 0));
  const V = j => VJ.indexOf(j), T = j => TJ.indexOf(j), L = j => LJ.indexOf(j);
  const last = s => s.slice(-1), init = s => s.slice(0, -1);
  const setT = (ch, t) => { const d = dec(ch); return com(d.l, d.v, t); };
  const vowelOf = ch => VJ[dec(ch).v];
  const finalOf = ch => TJ[dec(ch).t];
  const hasB = s => dec(last(s)).t !== 0;

  // ghép thêm patchim vào âm tiết cuối
  const addT = (s, j) => init(s) + setT(last(s), T(j));

  // gốc + 아/어 (chưa có 요)
  function aeo(stem, irr){
    const lc = last(stem);
    if(lc === "하") return init(stem) + "해";
    const d = dec(lc), v = VJ[d.v], f = TJ[d.t];
    if(irr === "ㅂ" && f === "ㅂ"){
      const s = init(stem) + com(d.l, d.v, 0);
      return s + (/^(돕|곱)$/.test(lc) ? "와" : "워");
    }
    if(irr === "ㄷ" && f === "ㄷ"){ return regular(init(stem) + com(d.l, d.v, T("ㄹ"))); }
    if(irr === "ㅅ" && f === "ㅅ"){
      const s = init(stem) + com(d.l, d.v, 0);
      return s + ((v === "ㅏ" || v === "ㅗ") ? "아" : "어");
    }
    if(irr === "ㅎ" && f === "ㅎ"){
      const nv = v === "ㅑ" ? "ㅒ" : (v === "ㅏ" || v === "ㅓ") ? "ㅐ" : v;
      return init(stem) + com(d.l, V(nv), 0);
    }
    if(irr === "르" && lc === "르" && stem.length > 1){
      const p = dec(stem.slice(-2, -1)), pv = VJ[p.v];
      const pre = stem.slice(0, -2) + com(p.l, p.v, T("ㄹ"));
      return pre + ((pv === "ㅏ" || pv === "ㅗ") ? "라" : "러");
    }
    if(v === "ㅡ" && f === ""){
      let nv = "ㅓ";
      if(stem.length > 1){ const pv = vowelOf(stem.slice(-2, -1)); nv = (pv === "ㅏ" || pv === "ㅗ") ? "ㅏ" : "ㅓ"; }
      return init(stem) + com(d.l, V(nv), 0);
    }
    return regular(stem);
  }
  function regular(stem){
    const lc = last(stem), d = dec(lc), v = VJ[d.v], f = TJ[d.t];
    const bright = (v === "ㅏ" || v === "ㅗ");
    if(f !== "") return stem + (bright ? "아" : "어");
    const map = {"ㅏ":"ㅏ","ㅓ":"ㅓ","ㅗ":"ㅘ","ㅜ":"ㅝ","ㅣ":"ㅕ","ㅐ":"ㅐ","ㅔ":"ㅔ","ㅚ":"ㅙ","ㅕ":"ㅕ","ㅙ":"ㅙ"};
    if(map[v]) return init(stem) + com(d.l, V(map[v]), 0);
    return stem + (bright ? "아" : "어");
  }

  // gốc dùng trước đuôi có (으): trả {s, needEu}
  function euStem(stem, irr){
    const lc = last(stem), d = dec(lc), f = TJ[d.t];
    if(irr === "ㅂ" && f === "ㅂ") return {s: init(stem) + com(d.l, d.v, 0) + "우", eu:false, rl:false};
    if(irr === "ㄷ" && f === "ㄷ") return {s: init(stem) + com(d.l, d.v, T("ㄹ")), eu:true, rl:false};
    if(irr === "ㅅ" && f === "ㅅ") return {s: init(stem) + com(d.l, d.v, 0), eu:true, rl:false, sep:true};
    if(irr === "ㅎ" && f === "ㅎ") return {s: init(stem) + com(d.l, d.v, 0), eu:false, rl:false};
    if(f === "ㄹ") return {s: stem, eu:false, rl:true};
    return {s: stem, eu: f !== "", rl:false};
  }
  // đuôi bắt đầu bằng phụ âm: 세요, 면, 니까, 러, 시...
  function withEu(stem, irr, tail){
    const e = euStem(stem, irr);
    if(e.rl){
      if(/^[ㄴ니세시셨습ㅂ]/.test(tail) || /^(세|시|니|ㅂ)/.test(tail)) return init(e.s) + setT(last(e.s), 0) + tail;
      return e.s + tail; // 살면, 살러
    }
    if(e.sep) return e.s + "으" + tail;
    return e.s + (e.eu ? "으" : "") + tail;
  }
  // đuôi là patchim: ㄹ (거예요, 수 있어요, 때), ㄴ (định ngữ quá khứ / tính từ)
  function withBatchim(stem, irr, j){
    const e = euStem(stem, irr);
    if(e.rl){ return j === "ㄹ" ? e.s : init(e.s) + setT(last(e.s), T(j)); }
    if(e.eu || e.sep) return e.s + (j === "ㄹ" ? "을" : "은");
    return addT(e.s, j);
  }

  function conj(word, irr, kind){
    if(!word.endsWith("다")) return null;
    const stem = word.slice(0, -1);
    const A = aeo(stem, irr);
    const past = addT(A, "ㅆ") + "어요";
    const lc = last(stem), f = finalOf(lc);
    let formal;
    if(f === "ㄹ") formal = init(stem) + setT(lc, T("ㅂ")) + "니다";
    else if(f !== "" ) formal = stem + "습니다";
    else formal = addT(stem, "ㅂ") + "니다";
    let adnPres;
    if(kind === "A"){
      adnPres = /(있|없)$/.test(stem) ? stem + "는" : withBatchim(stem, irr, "ㄴ");
    } else {
      adnPres = f === "ㄹ" ? init(stem) + setT(lc, 0) + "는" : stem + "는";
    }
    const out = {
      present: A + "요",
      past,
      formal,
      future: withBatchim(stem, irr, "ㄹ") + " 거예요",
      neg: stem + "지 않아요",
      negShort: "안 " + A + "요",
      and: stem + "고",
      but: stem + "지만",
      because: A + "서",
      if: withEu(stem, irr, "면"),
      adnPres,
      can: withBatchim(stem, irr, "ㄹ") + " 수 있어요"
    };
    if(kind !== "A"){
      out.want = stem + "고 싶어요";
      out.please = withEu(stem, irr, "세요");
      out.adnPast = withBatchim(stem, irr, "ㄴ");
      out.goTo = withEu(stem, irr, "러 가요");
      out.request = A + " 주세요";
    }
    if(lc === "하" && stem.length > 1 && kind !== "A"){ out.negShort = stem.slice(0, -1) + " 안 해요"; }
    return out;
  }
  return {conj, dec, com, hasB, aeo};
})();
