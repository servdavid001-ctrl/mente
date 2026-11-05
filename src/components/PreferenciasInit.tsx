/** script pre-paint: resuelve el tema antes del primer render (sin flash) */
const SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('mente-tema');var mq=window.matchMedia('(prefers-color-scheme: dark)');var pintar=function(){var v=localStorage.getItem('mente-tema');var oscuro=v==='oscuro'||((!v||v==='sistema')&&mq.matches);d.setAttribute('data-theme',oscuro?'dark':'light');};pintar();var sync=function(){var v=localStorage.getItem('mente-tema');if(!v||v==='sistema'){pintar();}};if(mq.addEventListener){mq.addEventListener('change',sync);}else if(mq.addListener){mq.addListener(sync);}}catch(e){}})();`;

export default function PreferenciasInit() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
