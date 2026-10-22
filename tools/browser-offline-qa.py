"""Portable file:// preview test with real browser storage, no storage replacement."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
checks=[];network=[];errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    context=browser.new_context(viewport={'width':390,'height':844},locale='de-DE',reduced_motion='reduce')
    context.set_offline(True)
    page=context.new_page();page.set_default_timeout(10000)
    page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http://','https://')) else None)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'dist'/'Wunderkapseln-preview.html').as_uri())
    page.locator('[data-action="play"]').click()
    page.wait_for_function('localStorage.getItem("wunderkapseln.save")!==null')
    before=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem("wunderkapseln.save")).payload)')
    assert before['game']['levelId']==1 and before['game']['moves']==24
    checks.append('portable file opens and starts offline using real browser storage')
    page.locator('[data-action="pause"]').click()
    page.reload();page.locator('[data-action="play"]').wait_for()
    assert 'Weiterspielen' in page.locator('[data-action="play"]').inner_text()
    page.locator('[data-action="play"]').click()
    after=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem("wunderkapseln.save")).payload)')
    assert after['game']==before['game'] and after['attempt']==before['attempt']
    assert after['profile']['lives']==5
    checks.append('real file reload restores the same ongoing board and does not spend a life')
    assert not network,network
    assert not errors,errors
    checks.append('no HTTP requests or runtime errors with the browser network disabled')
    browser.close()
report={'passed':len(checks),'checks':checks,'storage':'Chromium actual localStorage on file://; no storage mock'}
(root/'dist'/'qa'/'browser-offline-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
