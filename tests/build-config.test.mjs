import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
test('declared native versions match the checked official SDK-55 manifest',()=>{
 const expected=json('../docs/reference/expo-sdk55.json').dependencies,actual=json('../package.json').dependencies;
 for(const [name,version]of Object.entries(expected))assert.equal(actual[name],version,name);
});
test('sound effects do not request microphone or background audio capability',()=>{
 const app=json('../app.json').expo;const audio=app.plugins.find(p=>p[0]==='expo-audio')[1];
 assert.equal(audio.microphonePermission,false);assert.equal(audio.recordAudioAndroid,false);
 assert.equal(audio.enableBackgroundPlayback,false);assert.equal(audio.enableBackgroundRecording,false);
 assert.ok(app.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'));
});
test('native sound sources and unchanged canonical icon paths are present',()=>{
 const app=json('../app.json').expo;assert.equal(app.icon,app.splash.image);assert.equal(app.android.adaptiveIcon,undefined);
 const source=readFileSync(new URL('../native/useGameAudio.js',import.meta.url),'utf8');
 const files=[...source.matchAll(/require\('([^']+)'\)/g)].map(m=>new URL(m[1],new URL('../native/useGameAudio.js',import.meta.url)));
 assert.equal(files.length,14);for(const file of files)assert.ok(existsSync(file));
});
