/** Blocking FOUC theme script for root layout (Server Component safe). */
export const THEME_INIT_SCRIPT = `(function(){try{var k="theme",d="system",r=document.documentElement,t=localStorage.getItem(k)||d,s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",v=t==="system"?s:t;r.classList.remove("light","dark");r.classList.add(v);r.style.colorScheme=v}catch(e){}})();`;
