import ts from 'typescript';
import { checkAppIdentity } from './build-policy.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
for(const file of ['App.js','index.js','native/useGameAudio.js']){
 const source=readFileSync(file,'utf8');
 assert.doesNotMatch(source,/[\x00-\x08\x0b\x0c\x0e-\x1f]/,'Damaged control characters');
 const result=ts.transpileModule(source,{fileName:file.replace('.js','.jsx'),compilerOptions:{jsx:ts.JsxEmit.ReactJSX,allowJs:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
 const errors=result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log(`${file}: JSX syntax passed (not a native compilation).`);
}
const config=JSON.parse(readFileSync('app.json','utf8')).expo;
assert.equal(config.icon,config.splash.image);
assert.equal(config.android.adaptiveIcon,undefined);
const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.deepEqual(checkAppIdentity(pkg,config),[]);
console.log('Canonical icon/splash and distinct approved Apple/Android identities verified.');

const audio=config.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-audio')?.[1];
assert.equal(audio.microphonePermission,false);assert.equal(audio.recordAudioAndroid,false);assert.equal(audio.enableBackgroundPlayback,false);assert.equal(audio.enableBackgroundRecording,false);
assert.ok(config.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'));
console.log('Audio recording and background audio capabilities explicitly disabled.');
