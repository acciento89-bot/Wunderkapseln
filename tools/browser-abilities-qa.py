"""Browser audio engine tests; no claim of native device/headphone listening."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'dist/Wunderkapseln-preview.html').read_text()
sampler=(root/'dist/Wunderkapseln-soundcheck.html').read_text()
fixtures=json.loads(subprocess.check_output(['node','tools/qa-audio-fixtures.mjs'],cwd=root))
older=json.loads(subprocess.check_output(['node','tools/qa-fixtures.mjs'],cwd=root))
checks=[];errors=[]
def setup(browser,save=None,reduce=True,content=None):
    p=browser.new_page(viewport={'width':390,'height':844},locale='de-DE')
    p.on('pageerror',lambda e:errors.append(str(e)))
    if reduce:p.emulate_media(reduced_motion='reduce')
    p.evaluate('''({save,signatures})=>{
      const data=new Map(save?[['wunderkapseln.save',save]]:[]);
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
      window.audioEvents=[];window.maxVoices=0;let nextId=0;const active=new Set();
      const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
      AudioBufferSourceNode.prototype.start=function(...args){
        const id=++nextId;this.qaId=id;active.add(id);window.maxVoices=Math.max(window.maxVoices,active.size);
        const pcm=this.buffer.getChannelData(0);let sum=0;for(let i=0;i<pcm.length;i+=97)sum+=Math.abs(pcm[i]);
        const signature=pcm.length+':'+Math.round(sum*1e6);
        window.audioEvents.push({cue:signatures[signature]||signature,time:performance.now(),busy:!!document.querySelector('#board.busy')});
        this.addEventListener('ended',()=>active.delete(id));return start.apply(this,args);
      };
      AudioBufferSourceNode.prototype.stop=function(...args){active.delete(this.qaId);return stop.apply(this,args)};
    }''',{'save':save,'signatures':fixtures['signatures']})
    p.set_content(content or html)
    p.locator('[data-cue]' if content else '[data-action="play"]').first.wait_for()
    return p

def click(p,name):p.locator(f'[data-action="{name}"]').last.click()
def move(p,pair):
    for i in pair:p.locator(f'[data-hit="{i}"]').click()
    p.wait_for_function('!document.querySelector("#board.busy")')
def events(p):return p.evaluate('audioEvents.map(e=>e.cue)')
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    for cue in ['rocket','bomb','prism','mega']:
        p=setup(b,fixtures[cue]['save']);click(p,'play');move(p,fixtures[cue]['pair']);p.wait_for_timeout(120)
        assert events(p)[0]==cue,events(p);checks.append(f'{cue} is emitted by a real special swap');p.close()
    for cue in ['wind','tide','bloom']:
        p=setup(b,fixtures[cue]['save']);click(p,'play');click(p,'wonder');p.locator('[data-hit="0"]').click();p.wait_for_timeout(120)
        assert events(p)[0]==cue,events(p);checks.append(f'{cue} world ability uses its distinct actual PCM');p.close()
    p=setup(b,fixtures['bomb']['save'],reduce=False);click(p,'play');move(p,fixtures['bomb']['pair']);p.wait_for_timeout(1400)
    assert p.evaluate('audioEvents.some(e=>e.cue==="bomb"&&e.busy)');assert p.evaluate('maxVoices')<=3
    checks.append('ability sound starts during actual burst animation and never exceeds three voices');p.close()
    p=setup(b,fixtures['charge']['save']);click(p,'play');move(p,fixtures['charge']['pair']);p.wait_for_timeout(550)
    assert events(p).count('charge')==1;before=events(p);p.wait_for_timeout(1000);assert events(p)==before
    checks.append('newly charged wonder cues once and idle state ticks do not replay it');p.close()
    p=setup(b,fixtures['charge']['save']);click(p,'play');move(p,fixtures['charge']['pair']);click(p,'pause');p.wait_for_timeout(650)
    assert 'charge' not in events(p),events(p);click(p,'resume');p.wait_for_timeout(500);assert 'charge' not in events(p)
    checks.append('pause cancels pending charge and resume does not replay cancelled sound');p.close()
    p=setup(b,fixtures['muted']['save']);click(p,'play');move(p,fixtures['muted']['pair']);p.wait_for_timeout(700);assert events(p)==[]
    checks.append('saved mute suppresses big abilities and followups');p.close()
    p=setup(b,older['milestone']['save']);click(p,'play');move(p,older['milestone']['pair']);p.wait_for_timeout(1700)
    seq=events(p);assert 'win' in seq and 'restoration' in seq and seq.index('win')<seq.index('restoration'),seq
    before=seq;p.wait_for_timeout(600);assert events(p)==before;checks.append('eighth-win expansion has its own fanfare after the level win, with no duplicate');p.close()
    p=setup(b,content=sampler)
    assert p.locator('[data-cue]').count()==14
    for cue in fixtures['signatures'].values():
        before=len(events(p));p.locator(f'[data-cue="{cue}"]').click();p.wait_for_timeout(45)
        assert len(events(p))==before+1 and events(p)[-1]==cue
    checks.append('all 14 audition buttons start their actual distinct synthesized PCM')
    p.locator('#sequence').click();p.wait_for_timeout(120);p.locator('#stop').click();before=events(p);p.wait_for_timeout(2800);assert events(p)==before
    checks.append('audition stop cancels queued ability/win/restoration sequence')
    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth');checks.append('audio audition layout fits a 390px phone')
    p.close();assert errors==[],errors;checks.append('zero browser runtime errors in ability audio checks');b.close()
out={'passed':len(checks),'checks':checks,'scope':'Chromium Web Audio on controlled saves; not native or physical speaker validation'}
(root/'dist/qa/browser-abilities-report.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
