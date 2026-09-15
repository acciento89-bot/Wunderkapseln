"""Browser evidence for alpha 0.3.0; not a native/device test."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=root/'dist'/'qa';out.mkdir(parents=True,exist_ok=True)
html=(root/'dist'/'Wunderkapseln-preview.html').read_text()
script="""
import {freshProfile,finishLevel} from './core/profile.mjs';
import {createSession} from './core/session.mjs';
import {encodeSave} from './core/storage.mjs';
const p=finishLevel(freshProfile(Date.now(),'de'),1,3);p.lives=4;p.inventory.lives5=1;p.inventory.time60=1;p.inventory.time240=1;
console.log(encodeSave(createSession(p)));
"""
save=subprocess.check_output(['node','--input-type=module','-e',script],cwd=root,text=True).strip()
checks=[];errors=[]
def record(name):checks.append(name)
def setup(browser,primary=None,backup=None,failing=False,width=390,locale='de-DE'):
    p=browser.new_page(viewport={'width':width,'height':844},locale=locale)
    p.emulate_media(reduced_motion='reduce')
    p.on('pageerror',lambda e:errors.append(str(e)))
    p.evaluate('''args=>{
      window.qaStore=new Map();window.failReads=args.failing;window.writeCount=0;
      if(args.primary!==null)qaStore.set('wunderkapseln.save',args.primary);
      if(args.backup!==null)qaStore.set('wunderkapseln.save.backup',args.backup);
      Object.defineProperty(window,'localStorage',{value:{
        getItem:k=>{if(window.failReads)throw Error('temporary read failure');return qaStore.get(k)??null},
        setItem:(k,v)=>{window.writeCount++;qaStore.set(k,v)}
      }});
    }''',{'primary':primary,'backup':backup,'failing':failing})
    p.set_content(html);p.wait_for_timeout(150);return p

def saved(p):return p.evaluate('JSON.parse(JSON.parse(qaStore.get("wunderkapseln.save")).payload)')
def click(p,action):p.locator(f'[data-action="{action}"]').last.click()

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    p=setup(browser,primary=save,failing=True)
    assert p.locator('[data-action="initialize"]').count()==1,'read failure must show a retry button'
    assert p.locator('[data-action="play"]').count()==0
    assert p.evaluate('writeCount')==0
    p.screenshot(path=str(out/'save-protection-0.3-phone.png'),full_page=True)
    record('failed reads show a blocking retry screen and never write a fresh profile')
    p.evaluate('window.failReads=false');click(p,'initialize');p.locator('[data-action="play"]').wait_for()
    assert p.locator('[data-action="play"]').inner_text().endswith('Level 2')
    assert p.evaluate('qaStore.get("wunderkapseln.save")')==save
    record('retry restores the original unlocked level without replacing save bytes')
    click(p,'treasures');p.locator('[data-key="lives5"]').click();p.wait_for_timeout(100)
    assert saved(p)['profile']['lives']==4 and saved(p)['profile']['reserveLives']==5
    assert saved(p)['profile']['inventory']['lives5']==0
    assert p.locator('#reserve-value').inner_text()=='5'
    assert '+5' in p.locator('#life-value').inner_text()
    p.screenshot(path=str(out/'reserve-0.3-phone.png'),full_page=True)
    record('life-pack activation preserves all five reserves and the existing natural-life balance')
    p.locator('[data-key="time60"]').click();p.wait_for_timeout(100)
    assert saved(p)['profile']['unlimitedSeconds']==3600
    p.locator('[data-key="time240"]').click();p.wait_for_timeout(100)
    assert saved(p)['profile']['unlimitedSeconds']==18000
    p.wait_for_timeout(350);assert saved(p)['profile']['unlimitedSeconds']==18000
    record('owned one/four-hour packs have real activation controls and time stays paused in inventory')
    fresh=setup(browser);click(fresh,'play')
    rings=fresh.locator('#board-art rect[stroke="#ffdf96"]');assert rings.count()==2
    assert 'markierten' in fresh.locator('#caption').inner_text()
    pair=rings.evaluate_all('els=>els.map(el=>Number(el.parentElement.dataset.cell))')
    fresh.screenshot(path=str(out/'guided-start-0.3-phone.png'),full_page=True)
    before=saved(fresh)['game']['moves']
    for i in pair:fresh.locator(f'[data-hit="{i}"]').click()
    fresh.wait_for_function('!document.querySelector("#board.busy")');fresh.wait_for_timeout(100)
    assert saved(fresh)['game']['moves']==before-1
    assert 'markierten' not in fresh.locator('#caption').inner_text()
    record('opening guidance highlights an actual legal swap and disappears after playing it')
    if saved(fresh)['game']['status']!='playing':click(fresh,'next')
    before=saved(fresh);click(fresh,'hint');fresh.wait_for_timeout(100)
    assert saved(fresh)==before
    assert fresh.locator('#board-art rect[stroke="#ffdf96"]').count()==2
    record('manual goal-aware hints are free and leave saved gameplay unchanged')
    broken=setup(browser,primary='broken')
    assert broken.locator('[data-action="initialize"]').count()==1
    assert broken.evaluate('qaStore.get("wunderkapseln.save")')=='broken' and broken.evaluate('writeCount')==0
    record('unrecoverable corruption is not overwritten')
    future=json.dumps({'version':42,'payload':'future'})
    future_page=setup(browser,primary=future,backup=save)
    assert future_page.locator('[data-action="play"]').count()==0
    assert future_page.evaluate('writeCount')==0
    record('a newer-format primary is not downgraded to an older backup')
    recovery=setup(browser,primary='broken',backup=save)
    assert recovery.locator('[data-action="play"]').count()==1
    assert 'wiederhergestellt' in recovery.locator('[role="alert"]').inner_text()
    record('a readable valid backup still recovers from primary corruption')
    for width in [320,390,768,1024]:
        page=setup(browser,primary=save,width=width,locale='en-US');click(page,'treasures')
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
        page.close()
    record('inventory layouts do not overflow from small phones through tablets')
    assert not errors,errors
    record('no browser runtime errors in safety, guidance or inventory flows')
    browser.close()
(out/'browser-safety-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
