/* Bản offline: link tới trang khác trỏ vào trang trong gói */
(function(){
  var MAP = {"JZf6sbtsntEmUFmzCVMoj5": "luyen/index.html", "TM6sztssvGavUsnxxj37gS": "tra-cuu/index.html", "L6SnwB8dkaHgfXxGaDQLwa": "kho/index.html", "DonhSSWpNAJBiiGR5isr4o": "viet-tay/index.html"}, BASE = document.currentScript.src.replace(/offline\.js(\?.*)?$/, "");
  function fix(a){ var m = /claude\.ai\/artifact\/([A-Za-z0-9]+)/.exec(a.getAttribute("href") || ""); if(m && MAP[m[1]]){ a.setAttribute("href", BASE + MAP[m[1]]); a.removeAttribute("target"); } }
  document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("a[href]"); if(a) fix(a); }, true);
  window.__OFFLINE__ = true; window.__OFFMAP = MAP;
  if("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register(BASE + "sw.js").catch(function(){});
})();
