"""Real browser interaction checks for alpha 0.2. Not native device/store QA."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
output=root/'dist'/'qa';output.mkdir(parents=True,exist_ok=True)
html=(root/'dist'/'Wunderkapseln-preview.html').read_text()
fixtures=json.loads(subprocess.check_output(['node',str(root/'tools'/'qa-fixtures.mjs')]))
checks=[];errors=[]
def record(name): checks.append(name)
def setup(browser,save=None,width=390,height=844,locale='de-DE',reduce=True):
    page=browser.new_page(viewport={'width':width,'height':height},locale=locale,device_scale_factor=1)
    page.on('pageerror',lambda e:errors.append(str(e)))
    if reduce:page.emulate_media(reduced_motion='reduce')
    page.evaluate('''saved=>{
      const data=new Map(saved?[['wunderkapseln.save',saved]]:[]);
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
      window.audioStarts=0;window.audioStops=0;
      const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
      AudioBufferSourceNode.prototype.start=function(...a){window.audioStarts++;return start.apply(this,a)};
      AudioBufferSourceNode.prototype.stop=function(...a){window.audioStops++;return stop.apply(this,a)};
    }''',save)
    page.set_content(html);page.locator('[data-action="play"]').wait_for();return page

def click(page,name):page.locator(f'[data-action="{name}"]').last.click()
def session(page):return page.evaluate('JSON.parse(JSON.parse(localStorage.getItem("wunderkapseln.save")).payload)')
def best(page):return json.loads(subprocess.check_output(['node',str(root/'tests'/'choose-move.mjs')],input=json.dumps(session(page)['game']).encode()))
def move(page,pair):
    for i in pair:page.locator(f'[data-hit="{i}"]').click()
    page.wait_for_function('!document.querySelector("#board.busy")');page.wait_for_timeout(120)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    p=setup(browser)
    assert p.locator('.milestone-track i').count()==5
    assert '8 Levels' in p.locator('.progress-meta').first.inner_text()
    p.screenshot(path=str(output/'home-0.2-phone.png'),full_page=True)
    record('home shows the next real eight-win milestone and five-stage track')
    click(p,'play');assert session(p)['profile']['reducedMotion'] is False
    assert p.locator('#app').evaluate("el=>el.classList.contains('reduce')")
    record('OS reduced motion is respected without changing the saved player preference')
    move(p,best(p));p.wait_for_function('window.audioStarts > 0')
    # A move now has ability/outcome followups; wait for them before testing idle deduplication.
    p.wait_for_timeout(1500);played=p.evaluate('window.audioStarts');p.wait_for_timeout(350)
    assert p.evaluate('window.audioStarts')==played
    record('real Web Audio starts on a valid move and does not repeat on state ticks')
    click(p,'home');click(p,'settings');p.locator('[data-key="sound"]').click()
    assert p.locator('[data-key="sound"]').get_attribute('aria-checked')=='false'
    click(p,'home');click(p,'play')
    if session(p)['game']['status']!='playing':click(p,'next')
    move(p,best(p));p.wait_for_timeout(250);assert p.evaluate('window.audioStarts')==played
    assert session(p)['profile']['sound'] is False
    record('muted sounds remain silent during real moves and the preference is saved')
    p.screenshot(path=str(output/'game-0.2-phone.png'),full_page=True)
    click(p,'home');click(p,'atlas')
    assert p.locator('.world-card').count()==12
    for world in range(12):assert p.locator(f'.world-card [id="w{world}_landmark-{world}"]').count()==1
    p.screenshot(path=str(output/'atlas-0.2-phone.png'),full_page=True)
    record('atlas renders all twelve distinct landmarks')
    p.locator('[data-action="world"][data-id="11"]').click()
    assert p.locator('.level-node:disabled').count()==40
    assert p.locator('[id="w11_landmark-11"]').count()==1
    p.screenshot(path=str(output/'aurora-0.2-phone.png'),full_page=True)
    record('future-world previews are visible while their levels remain locked')
    milestone=setup(browser,fixtures['milestone']['save']);click(milestone,'play');move(milestone,fixtures['milestone']['pair'])
    assert milestone.locator('.milestone-celebration').count()==1
    assert 'Sternensteg' in milestone.locator('.milestone-celebration').inner_text()
    assert session(milestone)['profile']['unlocked']==9
    assert milestone.locator('[id="w0_restoration-0-1"]').count()>=1
    milestone.screenshot(path=str(output/'milestone-0.2-phone.png'),full_page=True)
    record('the eighth genuine win reveals its bridge, milestone message and next level')
    milestone.keyboard.press('Escape');assert milestone.locator('.level-grid').count()==1
    assert milestone.locator('[role="dialog"]').count()==0
    assert session(milestone)['profile']['lives']==5
    record('back from victory goes to level selection instead of stranding the finished board')
    complete=setup(browser,fixtures['completed']);click(complete,'atlas');complete.locator('[data-action="world"][data-id="0"]').click()
    assert complete.locator('.milestone-track .awake').count()==5
    assert 'voller Leben' in complete.locator('.restoration-card').inner_text()
    record('a completed world shows five milestones and no misleading next-milestone countdown')
    legacy=setup(browser,fixtures['legacy']);click(legacy,'settings')
    assert legacy.locator('[data-key="sound"]').get_attribute('aria-checked')=='true'
    record('version-1 alpha saves load with a valid default sound preference')
    for width,height in [(320,720),(390,844),(768,1024),(1024,1366)]:
        page=setup(browser,width=width,height=height,locale='en-US');click(page,'play')
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        box=page.locator('#board').bounding_box();assert abs(box['width']-box['height'])<1;assert box['width']<=width
        page.close()
    record('320px phone through 1024px tablet layouts have square boards and no horizontal overflow')
    assert errors==[],errors;record('no browser runtime exceptions in the new audio, restoration or navigation paths')
    browser.close()
(output/'browser-polish-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
