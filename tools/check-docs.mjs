import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
const required=['README.md','AGENTS.md',...['README','GAME_DESIGN','ARCHITECTURE','AUDIO_DESIGN','BUILD_RUNBOOK','MONETIZATION','QA_PLAN','STORE_COPY_DE','STORE_COPY_EN','REVIEW_NOTES','APPLE_SETUP','APPLE_STORE_COPY_DE','APPLE_STORE_COPY_EN','PRIVACY_DATA_MAP','ROADMAP','CODEX_HANDOFF','RELEASE_GATES','CHANGELOG-0.4.0','PRUEFBERICHT-0.4.0','CHANGELOG-0.4.1','PRUEFBERICHT-0.4.1','NATIVE_RUNTIME','NATIVE_CI','CHANGELOG-0.4.2','PRUEFBERICHT-0.4.2','CHANGELOG-0.5.0','PRUEFBERICHT-0.5.0','GITHUB_IMPORT','SOURCES'].map(name=>`docs/${name}.md`)];
for(const file of required){
 assert.ok(existsSync(file),`Missing ${file}`);
 const text=readFileSync(file,'utf8');assert.ok(text.startsWith('# '),`No heading: ${file}`);
 assert.doesNotMatch(text,/\b(TODO|TBD|FIXME)\b/,`Unresolved placeholder in ${file}`);
 for(const [,target] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  if(/^(https?:|mailto:|#)/.test(target))continue;
  assert.ok(existsSync(resolve(dirname(file),target.split('#')[0])),`Broken local link in ${file}: ${target}`);
 }
}
const meta=JSON.parse(readFileSync('docs/store-metadata.json','utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8')),app=JSON.parse(readFileSync('app.json','utf8')).expo;
assert.equal(meta.status,'draft_not_submitted');assert.equal(meta.version,pkg.version);assert.equal(app.version,pkg.version);
const limits={name:30,subtitle:30,shortDescription:80,promotionalText:170,description:4000,releaseNotes:4000};
for(const lang of ['de','en']){
 for(const [key,max] of Object.entries(limits))assert.ok(typeof meta[lang][key]==='string'&&[...meta[lang][key]].length>0&&[...meta[lang][key]].length<=max,`${lang}.${key} > ${max}`);
 assert.ok(Buffer.byteLength(meta[lang].keywords,'utf8')<=100,`${lang} keywords >100 bytes`);
 assert.ok(readFileSync(`docs/STORE_COPY_${lang.toUpperCase()}.md`,'utf8').includes(meta[lang].description),`${lang} Markdown and JSON must match`);
}
assert.equal(meta.defaultListingPlatform,'android');
assert.equal(meta.apple?.name,'WonderCaps');
assert.equal(meta.apple?.bundleIdentifier,'com.kamilunavo.wondercaps');
assert.equal(meta.apple?.bundleIdentifier,app.ios.bundleIdentifier);
assert.equal(meta.apple?.name,app.ios.infoPlist?.CFBundleDisplayName);
assert.equal(meta.apple?.sku,'wondercaps-001');
assert.equal(meta.apple?.recordStatus,'owner_reported_existing');
assert.equal(meta.apple?.verifiedInAppStoreConnect,false);
assert.ok(!JSON.stringify(app).includes(meta.apple.sku),'Apple SKU must not be inserted into native config');
for(const lang of ['de','en']){
 const fields=meta.apple?.localizations?.[lang];
 assert.equal(fields?.name,'WonderCaps');
 for(const [key,max] of Object.entries(limits))assert.ok(typeof fields[key]==='string'&&[...fields[key]].length>0&&[...fields[key]].length<=max,`Apple ${lang}.${key} > ${max}`);
 assert.ok(Buffer.byteLength(fields.keywords,'utf8')<=100,`Apple ${lang} keywords >100 bytes`);
 const markdown=readFileSync(`docs/APPLE_STORE_COPY_${lang.toUpperCase()}.md`,'utf8');
 for(const key of ['name','subtitle','promotionalText','keywords','description','releaseNotes'])assert.ok(markdown.includes(fields[key]),`Apple ${lang}.${key} Markdown differs`);
 assert.ok(!fields.description.includes('Wunderkapseln'),'Apple description must use WonderCaps');
 assert.equal(meta[lang].name,'Wunderkapseln','Android listing is unchanged');
}
assert.match(readFileSync('docs/RELEASE_GATES.md','utf8'),/nicht store-ready/);
console.log(`${required.length} Markdown documents verified; links valid; Android/Apple DE/EN metadata within field limits; Apple SKU and bundle matched locally; version ${pkg.version}; drafts not submitted.`);
