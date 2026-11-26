import pandas as pd, re, json, math, sys
f = sys.argv[1]
xs = pd.read_excel(f, sheet_name=None)
MES = {'jan':1,'fev':2,'mar':3,'abr':4,'mai':5,'jun':6,'jul':7,'ago':8,'set':9,'out':10,'nov':11,'dez':12}
months = []; objs = {}; objL = []; T = {'psl':[], 'desc':[], 'st':[], 'cc':[]}
TI = {k:{} for k in T}
def ti(t, v):
    v = '' if v is None or (isinstance(v,float) and math.isnan(v)) else str(v).strip()
    if v not in TI[t]: TI[t][v] = len(T[t]); T[t].append(v)
    return TI[t][v]
ST_FIX = {'#N/A':''}
ccinfo = {}
rows = {}
for sn, df in xs.items():
    m = re.match(r'([a-z]{3})-(\d{2})', sn.strip().lower())
    key = '20%s-%02d' % (m.group(2), MES[m.group(1)])
    df = df.dropna(how='all')
    df = df[df['Ext. ID Reserv. Obj.'].notna()]
    per = str(df['Period'].dropna().iloc[0]) if df['Period'].notna().any() else ''
    months.append(dict(k=key, sheet=sn, period=per, n=int(len(df))))
    R = []
    for _, r in df.iterrows():
        eid = str(r['Ext. ID Reserv. Obj.']).strip()
        if eid not in objs:
            mm = re.match(r'(R\d+)-(\d+)-([A-Z]+\d+)\.([^.]+)\.?(.*)', eid)
            site, _, bld, flr, sp = mm.groups()
            objs[eid] = len(objL)
            objL.append(dict(id=eid, site=site, fac=str(r['Facility Name']).strip(), city=str(r['City']).strip(), bld=bld, flr=flr, sp=sp))
        st = r.get('Space Type'); st = '' if st is None or (isinstance(st,float) and math.isnan(st)) or str(st).strip()=='#N/A' else str(st).strip()
        if not st and objL[objs[eid]]['bld'] in ('L01','C01'): st = 'Pátio (terreno)'
        cc = r.get('PSL CC'); cc = '' if cc is None or (isinstance(cc,float) and math.isnan(cc)) else str(int(cc)) if isinstance(cc,(int,float)) else str(cc)
        if 'PSL Name' in df.columns and isinstance(r.get('PSL Name'), str):
            ccinfo[cc] = dict(div=str(r.get('Division Name') or '').strip(), pn=str(r.get('PSL Name') or '').strip(), sub=str(r.get('Sub PSL Name') or '').strip(), hd=str(r.get('Hierarchy area description') or '').strip())
        R.append([objs[eid], ti('psl', r['PSL']), ti('desc', re.sub(r'\s+', ' ', str(r['Description']).strip())), round(float(r['Actual Cost']), 4), round(float(r['Occupied Area M²']), 3), ti('st', st), ti('cc', cc), round(float(r['Price Factor']), 3)])
    rows[key] = R
months.sort(key=lambda m: m['k'])
out = dict(src=f.split('/')[-1].split('-',1)[-1], months=months, objs=[[o['id'], o['site'], o['fac'], o['city'], o['bld'], o['flr'], o['sp']] for o in objL], T=T, cc=ccinfo, rows=rows)
json.dump(out, open('data.json','w'), ensure_ascii=False, separators=(',',':'))
tot = {k: round(sum(r[3] for r in v), 2) for k, v in rows.items()}
print(len(objL), tot, len(json.dumps(out, ensure_ascii=False, separators=(',',':')))//1024, 'KB')
print(T['psl']); print(T['st'])
