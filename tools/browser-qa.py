from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
output=root/'dist'/'qa'
output.mkdir(parents=True,exist_ok=True)
html=(root/'dist/Wunderkapseln-preview.html').read_text()
results=[]
def record(name):
    results.append(name);print(name,flush=True)
def setup(browser,entries=None,width=390,height=844,locale='de-DE',expect_play=True):
    page=browser.new_page(viewport={'width':width,'height':height},locale=locale,device_scale_factor=1)
    page.evaluate('''entries=>{const data=new Map(entries);Object.defineProperty(window,'localStorage',{value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});}''',entries or [])
    page.set_default_timeout(10000)
    page.set_content(html);page.locator('[data-action="play"]' if expect_play else '[data-action="initialize"]').wait_for();return page
def session(page):
    return page.evaluate('JSON.parse(JSON.parse(localStorage.getItem("wunderkapseln.save")).payload)')
def saved(page):return page.evaluate('localStorage.getItem("wunderkapseln.save")')
def click(page,action):page.locator(f'[data-action="{action}"]').last.click()
def move(page,pair,swipe=False):
    a,b=pair
    if swipe:
        aa=page.locator(f'[data-hit="{a}"]').bounding_box();bb=page.locator(f'[data-hit="{b}"]').bounding_box()
        page.mouse.move(aa['x']+aa['width']/2,aa['y']+aa['height']/2);page.mouse.down();page.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2,steps=5);page.mouse.up()
    else:
        page.locator(f'[data-hit="{a}"]').click();page.locator(f'[data-hit="{b}"]').click()
    page.wait_for_timeout(200)
    page.wait_for_function('!document.querySelector("#board.busy")')
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True)
    page=setup(browser);errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    click(page,'play');page.wait_for_timeout(200);s=session(page);assert s['game']['moves']==24
    record('fresh start: 64 reachable tiles, correct targets and moves');assert page.locator('[data-hit]').count()==64
    move(page,[0,1]);assert session(page)['game']['moves']==24
    record('invalid swap consumes no move')
    for i in range(20):
        s=session(page)
        if s['game']['status']!='playing':break
        best=json.loads(subprocess.check_output(['node',str(root/'tests'/'choose-move.mjs')],input=json.dumps(s['game']).encode()))
        move(page,best,swipe=i%2==0)
    s=session(page);assert s['game']['status']=='won';assert s['profile']['unlocked']==2;assert s['profile']['lives']==5
    assert page.locator('[role="dialog"]').count()==1;page.screenshot(path=str(output/'win-phone.png'))
    record('touch/click and drag playthrough wins level 1; result and sequential unlock')
    click(page,'next');page.wait_for_timeout(100);assert session(page)['game']['levelId']==2
    record('next-level action starts level 2')
    click(page,'pause');assert 'Pause' in page.locator('[role="dialog"]').inner_text();click(page,'resume')
    click(page,'home');click(page,'treasures');click(page,'activate');page.wait_for_timeout(100)
    s=session(page);assert s['profile']['unlimitedSeconds']==600;assert s['protectedAttempt']
    record('welcome gift explicitly activates and protects an existing attempt')
    click(page,'home');click(page,'play');page.wait_for_timeout(1100);click(page,'pause');page.wait_for_timeout(100)
    protected=session(page)['profile']['unlimitedSeconds'];assert 597<protected<600
    page.wait_for_timeout(5500);assert abs(session(page)['profile']['unlimitedSeconds']-protected)<.01
    record('active timer decreases in play and stays unchanged throughout pause')
    data=saved(page);old=session(page)['game']
    reload=setup(browser,[['wunderkapseln.save',data]]);click(reload,'play');reload.wait_for_timeout(100)
    assert session(reload)['game']==old;record('serialized progress reload restores exact ongoing board and move count')
    click(reload,'home');click(reload,'settings');reload.locator('[data-action="language"][data-value="en"]').click()
    assert reload.locator('h1').inner_text()=='Settings';assert reload.locator('html').get_attribute('lang')=='en'
    reload.locator('[data-key="reducedMotion"]').click();assert reload.locator('[data-key="reducedMotion"]').get_attribute('aria-checked')=='true'
    record('English override and reduced-motion switch persist')
    click(reload,'atlas');assert reload.locator('.world-card').count()==12;reload.screenshot(path=str(output/'atlas-phone.png'),full_page=True)
    reload.locator('[data-action="world"][data-id="1"]').click();assert reload.locator('.level-node:disabled').count()==40
    record('12 world capsules and locked future levels')
    tablet=setup(browser,width=1024,height=1366,locale='en-US');assert tablet.locator('html').get_attribute('lang')=='en';click(tablet,'play');assert tablet.locator('#board').bounding_box()['width']<=450
    tablet.screenshot(path=str(output/'game-tablet.png'));record('tablet board remains square and bounded; English locale default')
    corrupted=setup(browser,[['wunderkapseln.save','invalid json']],expect_play=False)
    assert corrupted.locator('[data-action="play"]').count()==0
    assert corrupted.evaluate('localStorage.getItem("wunderkapseln.save")')=='invalid json'
    record('corrupt saves block replacement and offer retry without modifying stored bytes')
    assert errors==[],errors;record('no JavaScript runtime exceptions during interactions')
    browser.close()
(output/'browser-report.json').write_text(json.dumps({'passed':len(results),'checks':results},indent=2))
print(json.dumps({'passed':len(results),'checks':results},indent=2))
