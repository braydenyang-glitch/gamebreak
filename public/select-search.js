import {getLocale} from './locale.js';
let sequence=0;
export function enhanceSelectSearch(root){for(const select of root.querySelectorAll('select')){
 if(select.options.length<40||select.dataset.searchable)continue;select.dataset.searchable='true';
 const all=[...select.options].map(o=>o.cloneNode(true)),locale=getLocale(),id='select-search-'+(++sequence);
 const text=locale==='ja'?['選択肢を検索','件の候補（現在の選択も表示）']:locale==='zh-Hant'?['搜尋選項','個符合項目（另保留目前選擇）']:['Search options','matches (current selection is kept)'];
 const field=document.createElement('div');field.className='select-search';const label=document.createElement('label');label.htmlFor=id;label.textContent=text[0];const input=document.createElement('input');input.type='search';input.id=id;input.autocomplete='off';input.setAttribute('aria-controls',select.id|| (select.id=id+'-options'));input.placeholder=text[0];const result=document.createElement('small');result.setAttribute('role','status');field.append(label,input,result);const parent=select.closest('label');if(parent){parent.before(field);select.setAttribute('aria-label',[...parent.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ')||text[0]);}else select.before(field);
 input.addEventListener('input',()=>{const selected=select.value,words=input.value.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean),matches=all.filter(o=>words.every(w=>o.textContent.normalize('NFKC').toLowerCase().includes(w)));select.replaceChildren(...all.filter(o=>matches.includes(o)||o.value===selected).map(o=>o.cloneNode(true)));select.value=selected;result.textContent=matches.length+' '+text[1];});
}}
