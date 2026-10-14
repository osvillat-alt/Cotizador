// Run: node check.mjs. No packages required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('CCMMCM/index.html', import.meta.url), 'utf8');
const elements = new Map();
const storage = new Map();
const element = id => {
  if (!elements.has(id)) {
    let markup = '';
    let value = '';
    const el = {id, checked: false, options: [], classList: {add() {}, remove() {}}};
    Object.defineProperty(el, 'value', {get: () => value, set: next => {value = String(next);}});
    const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    Object.defineProperty(el, 'innerHTML', {get: () => markup, set: text => {
      markup = text;
      const options = [...text.matchAll(/<option\b([^>]*)>(.*?)<\/option>/g)];
      el.options = options.map(([,attrs,label]) => ({value: decode(attrs.match(/value="([^"]*)"/)?.[1] ?? label)}));
      if (options.length) el.value = el.options[Math.max(0, options.findIndex(([,attrs]) => /\bselected\b/.test(attrs)))].value;
      for (const [,attrs] of text.matchAll(/<input\b([^>]*)>/g)) {
        const childId = attrs.match(/id="([^"]*)"/)?.[1];
        if (childId) element(childId).value = decode(attrs.match(/value="([^"]*)"/)?.[1] ?? '');
      }
      for (const [,childId,body] of text.matchAll(/<select\b[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/select>/g)) element(childId).innerHTML = body;
    }});
    elements.set(id, el);
  }
  return elements.get(id);
};
let opened = 0;
const sandbox = {console, document: {getElementById: element, querySelectorAll: selector => selector.startsWith('#tab-cotizar') ? [...elements.values()].filter(e => /^(q[A-Z]|component-|amount-|mcmReviewed)/.test(e.id)) : []},
  window: {scrollTo() {}, open() {opened++;}}, alert() {}, confirm: () => true,
  localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)}};
vm.createContext(sandbox);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\n    init\(\);/, ''), sandbox);
const run = code => vm.runInContext(code, sandbox);
run('db = seedCopy()');
for (const [key, count] of Object.entries({recipes:24, insumos:62, quotes:1, orders:9, sales:7, extras:0})) assert.equal(run(`db.${key}.length`), count);
assert.equal(run('db.recipes.reduce((n,r)=>n+r.ingredients.length,0)'), 133);
assert.equal(run('db.insumos.every(s=>s.pr===null)'), true);
const historicalData = run('JSON.stringify([db.quotes,db.orders,db.sales])');
run('db = prepareDB(JSON.parse(JSON.stringify(db))); saveDB(); db = loadDB()');
assert.equal(run('JSON.stringify([db.quotes,db.orders,db.sales])'), historicalData);
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html));
assert.ok(!/(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,}|-----BEGIN .*PRIVATE KEY-----)/.test(html));
assert.ok(html.includes('connect-src https://*.googleapis.com'));
assert.ok(html.includes("object-src 'none'"));
assert.ok(html.includes('"noopener,noreferrer"'));
run(`db.recipes=[]; db.insumos=[]; db.quotes=[]; db.orders=[]; db.sales=[];
db.insumos.push({id:'test',n:'Prueba',p:100,u:'gr',pr:20});
db.recipes.push({id:20001,name:'Prueba',ingredients:[{i:'Prueba',qty:50,u:'gr',insumoId:'test',factor:1}]});`);
assert.equal(run('recipeCost(db.recipes[0]).total'), 10);
run('saveDB(); db = loadDB()');
assert.equal(run('recipeCost(db.recipes[0]).total'), 10);
assert.throws(() => run('prepareDB({...db, schemaVersion:3})'));
assert.throws(() => run('prepareDB({...db, quotes:[{id:"1);alert(1)"}]})'));
for (const version of [1, 2]) {
  run(`db.schemaVersion = ${version}; db.recipes[0].ingredients[0].qty = null; db.recipes[0].ingredients[0].costingQty = '\" autofocus onfocus=\"alert(1)'`);
  assert.throws(() => run('prepareDB(db)'));
  run('renderRecipes()');
  assert.ok(!element('recipesList').innerHTML.includes('value="" autofocus'));
  assert.ok(element('recipesList').innerHTML.includes('&quot; autofocus'));
  run('db.recipes[0].ingredients[0].qty = "<img src=x onerror=alert(1)>"; db.recipes[0].ingredients[0].qtyText = "=A1"');
  assert.throws(() => run('prepareDB(db)'));
  run('renderRecipes()');
  assert.ok(!element('recipesList').innerHTML.includes('<img src=x'));
}
// Exercise cloud intake through the real quote engine and the existing local save flow.
const request = {version:1, tamano:'18 cm', saborPan:'Vainilla', consistencia:'Seco', betun:'Chantilly',
  rellenos:['Nuez','Nutella'], detalleFruta:'', detallesLogo:'Flores <img src=x onerror=alert(1)>',
  imagenReferencia:'[IMAGEN_LOCAL]', fraseFondant:'Feliz cumpleaños', fechaEntrega:'2026-10-20', horaEntrega:'16:30',
  nombreCliente:'Cliente de prueba', telefonoCliente:'8711234567', comentariosAdicionales:'Sin almendra'};
sandbox.request = request;
for (const invalid of [{...request, version:2}, {...request, rellenos:'Nuez'}, {...request, telefonoCliente:''},
  {...request, fechaEntrega:'2026-02-31'}, {...request, horaEntrega:'25:00'}, {...request, detallesLogo:'x'.repeat(1001)}]) {
  sandbox.invalidRequest = invalid;
  assert.throws(() => run('validateMCMRequest(invalidRequest)'));
}
run('db = seedCopy(); saveDB(); renderCotizadorSelects(); applySettingsToQuoteForm(); renderComponents({})');
element('qCliente').value = 'Edición en curso';
element('qNotas').value = 'Conservar notas';
element('qFigura').value = 'Corazón';
element('qBase').value = '123';
const history = run('JSON.stringify([db.orders,db.sales,db.quotes])');
assert.equal(run('receiveMCMRequests([{id:"cloud-1",data:request}]).imported'), 1);
assert.equal(element('qCliente').value, 'Edición en curso');
assert.equal(element('qNotas').value, 'Conservar notas');
assert.equal(element('qFigura').value, 'Corazón');
assert.equal(element('qBase').value, '123');
assert.equal(run('db.quotes[0].estado'), 'Pendiente');
assert.equal(run('db.quotes[0].precioFinal'), null);
assert.equal(run('db.quotes[0].relleno'), 'Nuez + Crema de avellana');
assert.equal(run('db.quotes[0].diseno'), 'Personalizado');
assert.equal(run('JSON.stringify([db.orders,db.sales,db.quotes.slice(1)])'), history);
assert.equal(run('receiveMCMRequests([{id:"cloud-1",data:request}]).imported'), 0);
assert.ok(!element('quotesList').innerHTML.includes('<img src=x'));
assert.ok(element('quotesList').innerHTML.includes('Costos por completar'));
run('shareQuote(db.quotes[0].id); quoteToOrder(db.quotes[0].id)');
assert.equal(opened, 0);
assert.equal(run('db.orders.length'), 9);
run('loadQuote(db.quotes[0].id)');
assert.equal(run('getQuotePayload()'), null);
element('mcmReviewed').checked = true;
assert.equal(run('getQuotePayload()'), null); // Confirmation cannot bypass missing costs.
run('for (const [key] of COMPONENTS) { document.getElementById("component-"+key).value="manual"; document.getElementById("amount-"+key).value="10"; }');
element('qBase').value = '5';
element('qMerma').value = '10';
element('qMargen').value = '50';
element('qRound').checked = true;
assert.equal(run('calcQuote().precioFinal'), 100);
const draftId = run('db.quotes[0].id');
run('saveQuote(true)');
assert.equal(run('db.quotes.length'), 2);
assert.equal(run('db.quotes[0].id'), draftId);
assert.equal(run('db.quotes[0].estado'), 'Autorizada');
assert.equal(run('db.orders[0].date'), request.fechaEntrega);
assert.equal(run('db.orders[0].time'), request.horaEntrega);
assert.equal(run('db.orders[0].phone'), request.telefonoCliente);
run('db = loadDB()');
assert.equal(run('receiveMCMRequests([{id:"cloud-1",data:request}]).imported'), 0);
assert.equal(run('receiveMCMRequests([{id:"cloud-bad",data:{...request,version:3}}]).invalid'), 1);
const persisted = storage.get(run('DB_KEY'));
sandbox.localStorage.setItem = () => {throw Error('disk full');};
assert.throws(() => run('receiveMCMRequests([{id:"cloud-2",data:request}])'));
assert.equal(run('db.mcmReceived.includes("cloud-2")'), false);
assert.equal(run('db.quotes.length'), 2);
assert.equal(storage.get(run('DB_KEY')), persisted);
sandbox.localStorage.setItem = (key,value) => storage.set(key,value);
assert.equal(run('receiveMCMRequests([{id:"cloud-2",data:request}]).imported'), 1);
run('fillMCMRequest({...request, tamano:"30 cm"})');
assert.equal(run('getQuotePayload(true).size'), '30 cm');
assert.ok(run('calcQuote().issues.some(i=>i.includes("tamaño disponible"))'));
// Cursor and page checks use only memory: no Firebase connection or billable reads.
sandbox.cursor = {seconds:1780000000,nanoseconds:123,id:'cloud-3'};
assert.equal(run('getMCMSyncCursor()'), null);
assert.equal(run('receiveMCMRequests([{id:"cloud-3",data:request}],cursor).imported'),1);
assert.equal(run('JSON.stringify(getMCMSyncCursor())'),JSON.stringify(sandbox.cursor));
run('db=loadDB()');
assert.equal(run('getMCMSyncCursor().id'),'cloud-3');
assert.throws(()=>run('receiveMCMRequests([], {...cursor,seconds:-1})'));
assert.throws(()=>run('prepareDB({...db,mcmCursor:{...cursor,nanoseconds:1000000000}})'));
sandbox.localStorage.setItem=()=>{throw Error('disk full');};
assert.throws(()=>run('receiveMCMRequests([{id:"cloud-4",data:request}],{...cursor,id:"cloud-4"})'));
assert.equal(run('getMCMSyncCursor().id'),'cloud-3');
assert.equal(run('db.mcmReceived.includes("cloud-4")'),false);
sandbox.localStorage.setItem=(key,value)=>storage.set(key,value);
const listeners=[];
let authCallback;
let stops=0;
const moduleSandbox={console,document:sandbox.document,
  initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),GoogleAuthProvider:class {},
  signInWithPopup:async()=>{},signOut:async()=>{},onAuthStateChanged:(_,fn)=>{authCallback=fn;},
  collection:(_,name)=>({collection:name}),documentId:()=>'__name__',orderBy:field=>({orderBy:field}),
  limit:number=>({limit:number}),query:(...clauses)=>clauses,
  Timestamp:class {constructor(seconds,nanoseconds){this.seconds=seconds;this.nanoseconds=nanoseconds;}},
  startAfter:(time,id)=>({after:time,id}),
  onSnapshot:(query,options,callback)=>{listeners.push({query,options,callback});return()=>{stops++;};},
  window:{getMCMSyncCursor:()=>run('getMCMSyncCursor()'),receiveMCMRequests:(records,cursor)=>{
    sandbox.pageRecords=records;sandbox.pageCursor=cursor;return run('receiveMCMRequests(pageRecords,pageCursor)');
  }}};
vm.createContext(moduleSandbox);
vm.runInContext(fs.readFileSync(new URL('CCMMCM/mcm-sync.js',import.meta.url),'utf8').replace(/^import[\s\S]*?;\s*/gm,'').replace(/^export /gm,''),moduleSandbox);
authCallback({email:'other@example.com',emailVerified:true});
assert.equal(listeners.length,0);
authCallback({email:'osvillat@gmail.com',emailVerified:true});
assert.equal(listeners[0].query.at(-1).limit,50);
assert.equal(listeners[0].query.at(-2).id,'cloud-3');
assert.equal(listeners[0].query.at(-2).after.nanoseconds,123);
const docs=Array.from({length:50},(_,i)=>({id:'page-'+String(i).padStart(2,'0'),data:()=>({...request,createdAt:{seconds:1780000001,nanoseconds:i}})}));
listeners[0].callback({metadata:{fromCache:false},docs,size:50});
assert.equal(listeners.length,2);
assert.equal(stops,1);
assert.equal(listeners[1].query.at(-2).id,'page-49');
assert.equal(listeners[1].query.at(-2).after.nanoseconds,49);
authCallback(null);
assert.equal(stops,2);
console.log('Historical data, costs, hostile inputs, intake, deduplication, editing preservation, approval, failed-storage retry and saved 50-request pagination verified locally. No Firebase connection.');
