// Run: node check.mjs. No packages required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('CCMMCM/index.html', import.meta.url), 'utf8');
const elements = new Map();
const storage = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {value: '', innerHTML: '', checked: false, options: [], classList: {add() {}, remove() {}}});
  return elements.get(id);
};
const sandbox = {console, document: {getElementById: element, querySelectorAll: () => []},
  window: {scrollTo() {}}, alert() {}, confirm: () => true,
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
assert.ok(html.includes("connect-src 'none'"));
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
console.log('24 recipes, 133 ingredients, historical customers, snapshots, local persistence, live costs and hostile backups verified.');
