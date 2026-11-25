/* Bản offline: link tới trang khác trỏ vào trang trong gói */
(function(){
  var MAP = {"5F4TG3obZ4PuERA42RpSug": "luyen/index.html", "Nn2Y2LRdVpRqXnYXb3HW8s": "ngu-phap/index.html", "YNwTPA4h31FidC5H3yc9D5": "viet-tay/index.html"}, BASE = document.currentScript.src.replace(/offline\.js(\?.*)?$/, "");
  function fix(a){ var m = /claude\.ai\/artifact\/([A-Za-z0-9]+)/.exec(a.getAttribute("href") || ""); if(m && MAP[m[1]]){ a.setAttribute("href", BASE + MAP[m[1]]); a.removeAttribute("target"); } }
  document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("a[href]"); if(a) fix(a); }, true);
  window.__OFFLINE__ = true; window.__OFFMAP = MAP;
  if("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register(BASE + "sw.js").catch(function(){});
})();
