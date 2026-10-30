const DEFAULT_PAGES = [
 {chapter:"ГЛАВА I · НАЧАЛО",title:"Первая страница",text:"В начале была тишина.\n\nНе было ни времени, ни света, ни имени, которым можно было бы назвать пустоту. Лишь бесконечное ожидание — словно мир задержал дыхание перед первым словом.\n\nИ тогда появилась мысль. Маленькая искра среди бескрайней темноты. Она не знала, кем была, но уже стремилась стать чем-то большим.\n\nТак начинается каждая история: с тишины, которая решает заговорить."},
 {chapter:"ГЛАВА II · ПУТЬ",title:"За пределами света",text:"Тот, кто однажды увидел свет, неизбежно замечает тени.\n\nДорога редко бывает прямой. Она петляет среди забытых воспоминаний, проходит через двери, которые никто не решался открыть, и приводит туда, где ответы становятся новыми вопросами.\n\nНе бойся потеряться между строк. Иногда именно там находятся самые важные слова."},
 {chapter:"ГЛАВА III · ВЕЧНОСТЬ",title:"Последняя глава",text:"Но у этой книги нет последней страницы.\n\nКаждый читатель оставляет здесь частицу себя: мысль, вопрос, надежду или историю. И потому книга продолжает жить даже тогда, когда её закрывают.\n\nЕсли ты дошёл до этих строк — значит, теперь в ней есть и твоя глава.\n\nПереверни страницу. Возможно, дальше начинается что-то новое."}
];
let pages = loadPages(), current = Math.min(Number(localStorage.getItem("eternal-current")||0), pages.length-1), selected = current;
const $ = id => document.getElementById(id);
const pageText = $("pageText");
let audioCtx = null, ambienceOsc = null, ambienceGain = null;
function loadPages(){try{const p=JSON.parse(localStorage.getItem("eternal-pages"));return Array.isArray(p)&&p.length?p:DEFAULT_PAGES.map(x=>({...x}));}catch{return DEFAULT_PAGES.map(x=>({...x}));}}
function persist(){localStorage.setItem("eternal-pages",JSON.stringify(pages));localStorage.setItem("eternal-current",String(current));}
function render(){
 const p=pages[current]; $("chapterLabel").textContent=p.chapter||"БЕЗ НАЗВАНИЯ";$("pageTitle").textContent=p.title||"Без названия";
 pageText.innerHTML=""; (p.text||"").split(/\n\s*\n/).forEach((part,i)=>{const el=document.createElement("p");el.textContent=part;if(i===0)el.className="dropcap";pageText.append(el);});
 $("currentPage").textContent=String(current+1).padStart(2,"0");$("totalPages").textContent=String(pages.length).padStart(2,"0");$("rightNumber").textContent=String(current+1).padStart(2,"0");$("prevBtn").disabled=current===0;$("nextBtn").disabled=current===pages.length-1;
 $("leftNumber").textContent="✧";persist();renderList();
}
function renderList(){const list=$("pageList");list.innerHTML="";pages.forEach((p,i)=>{const b=document.createElement("button");b.className="page-item"+(i===selected?" active":"");b.textContent=`${String(i+1).padStart(2,"0")} · ${p.title||"Без названия"}`;b.onclick=()=>selectPage(i);list.append(b);});}
function selectPage(i){selected=i;$("editTitle").value=pages[i].title||"";$("editChapter").value=pages[i].chapter||"";$("editText").value=pages[i].text||"";renderList();}
function flip(dir){const next=current+dir;if(next<0||next>=pages.length)return;playPageSound();const book=$("book");book.animate([{transform:"rotateY(0deg)"},{transform:`rotateY(${dir>0?-3:3}deg)`},{transform:"rotateY(0deg)"}],{duration:260,easing:"ease-out"});current=next;selected=next;render();if($("editorPanel").classList.contains("open"))selectPage(current);}
$("prevBtn").onclick=()=>flip(-1);$("nextBtn").onclick=()=>flip(1);
function openPanel(id){$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");}
function closePanel(id){$(id).classList.remove("open");$(id).setAttribute("aria-hidden","true");}
$("editToggle").onclick=()=>{openPanel("editorPanel");selectPage(current);};$("closeEditor").onclick=()=>closePanel("editorPanel");
$("settingsToggle").onclick=()=>openPanel("settingsPanel");$("closeSettings").onclick=()=>closePanel("settingsPanel");
$("addPage").onclick=()=>{pages.push({chapter:"НОВАЯ ГЛАВА",title:"Новая страница",text:"Начни писать здесь..."});selected=pages.length-1;current=selected;render();selectPage(selected);toast("Создана новая страница");};
$("savePage").onclick=()=>{pages[selected]={title:$("editTitle").value.trim()||"Без названия",chapter:$("editChapter").value.trim(),text:$("editText").value};current=selected;render();toast("Страница сохранена");};
$("deletePage").onclick=()=>{if(pages.length===1){toast("В книге должна остаться хотя бы одна страница");return;}pages.splice(selected,1);current=Math.min(selected,pages.length-1);selected=current;render();selectPage(current);toast("Страница удалена");};
$("exportBook").onclick=()=>{const blob=new Blob([JSON.stringify(pages,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eternal-book.json";a.click();URL.revokeObjectURL(a.href);};
$("importBook").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data)||!data.length||!data.every(p=>typeof p.title==="string"&&typeof p.text==="string"))throw Error();pages=data.map(p=>({title:p.title,chapter:p.chapter||"",text:p.text}));current=selected=0;render();selectPage(0);toast("Книга импортирована");}catch{toast("Не удалось прочитать JSON-файл");}e.target.value="";};
function toast(s){const t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2300);}
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();return audioCtx;}
function playPageSound(){if(!$("pageSoundToggle").checked)return;try{const c=getAudio(),buffer=c.createBuffer(1,c.sampleRate*.16,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();src.buffer=buffer;filter.type="lowpass";filter.frequency.value=1700;gain.gain.value=.12;src.connect(filter);filter.connect(gain);gain.connect(c.destination);src.start();}catch{}}
function ambience(on){try{const c=getAudio();if(on){if(ambienceOsc)return;ambienceOsc=c.createOscillator();ambienceGain=c.createGain();const low=c.createBiquadFilter();ambienceOsc.type="sine";ambienceOsc.frequency.value=54;low.type="lowpass";low.frequency.value=100;ambienceGain.gain.value=.012;ambienceOsc.connect(low);low.connect(ambienceGain);ambienceGain.connect(c.destination);ambienceOsc.start();}else if(ambienceOsc){ambienceOsc.stop();ambienceOsc=null;}}catch{}}
$("soundToggle").onclick=()=>{$("ambienceToggle").checked=!$("ambienceToggle").checked;ambience($("ambienceToggle").checked);toast($("ambienceToggle").checked?"Атмосферный звук включён":"Звук выключен");};
$("ambienceToggle").onchange=e=>ambience(e.target.checked);
$("fontSelect").onchange=e=>{pageText.style.fontFamily=({serif:"'Cormorant Garamond',serif",fell:"'IM Fell English',serif",script:"'Marck Script',cursive"})[e.target.value];};
$("fontSize").oninput=e=>pageText.style.fontSize=e.target.value+"px";
document.addEventListener("keydown",e=>{if(e.key==="ArrowRight")flip(1);if(e.key==="ArrowLeft")flip(-1);if(e.key==="Escape"){closePanel("editorPanel");closePanel("settingsPanel");}});
render();