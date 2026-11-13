#!/usr/bin/env python3
"""Read-only full remote branch audit. Does NOT delete or rewrite refs."""
from pathlib import Path
import subprocess,json,datetime
def git(*args):
 return subprocess.check_output(['git',*args],text=True).strip()
names=git('for-each-ref','--format=%(refname:short)','refs/remotes/origin').splitlines()
main='origin/main';head=git('rev-parse',main)
rows=[]
for name in names:
 if name in ('origin/HEAD',main):continue
 left,right=map(int,git('rev-list','--left-right','--count',main+'...'+name).split())
 status='contained-in-main' if right==0 else 'divergent-needs-semantic-review'
 subject=git('log','-1','--format=%s',name)
 rows.append({'ref':name,'sha':git('rev-parse',name),
              'behindMain':left,'uniqueCommits':right,
              'classification':status,'lastCommitSubject':subject})
rows.sort(key=lambda r:r['ref'])
out={'auditedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
     'mainSha':head,'remoteBranchCountExcludingMain':len(rows),
     'containsMain':sum(x['classification']=='contained-in-main' for x in rows),
     'divergent':sum(x['classification']=='divergent-needs-semantic-review' for x in rows),
     'rules':['Do not merge wholesale old experimental R20-R124 branches',
      'A divergent Git history is not evidence its feature is absent',
      'Preserve branch SHA before any future deletion',
      'Only new reviewed changes integrate through the current main and real-browser QA'],
     'branches':rows}
p=Path('docs/R126_BRANCH_INVENTORY.json');p.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('R126_BRANCH_AUDIT',json.dumps({'main':head[:10],'branches':len(rows),
 'contained':out['containsMain'],'divergent':out['divergent']}))
