import pymupdf as fitz, numpy as np, cv2, json, re
import sys
doc = fitz.open(sys.argv[1])  # PDF da planta R008015 (rev. 28/11/2024)
p = doc[0]
S = 4
W, H = 1191*S, 842*S
def T(pt): return (pt.y*S, (842-pt.x)*S)
bound = np.zeros((H,W), np.uint8)
colmasks = {}
LEG = {'Baroid':(1.0,1.0,0.498),'CMTG':(0.722,0.361,0.451),'HCT':(1.0,0.588,0.18),'IEM':(0.757,0.431,0.867),'L&T':(1.0,0.498,0.498),
 'PE':(1.0,0.78,0.561),'TSS':(1.0,0.0,0.498),'WLP':(0.498,1.0,1.0),'MULTICHEM':(0.0,1.0,0.749),'HDBS':(0.867,0.694,0.788),'SDS':(0.498,0.624,1.0),
 'SUP':(0.859,0.859,0.859),'HPS-CT':(0.867,0.647,0.431),'HPS-N2':(0.302,0.561,0.494),'Quality':(0.208,0.376,0.063),'PPS':(0.0,0.0,1.0),'DME':(0.749,0.498,1.0)}
col2k = {v:k for k,v in LEG.items()}
for k in LEG: colmasks[k] = np.zeros((H,W), np.uint8)
fillmask = {k: np.zeros((H,W), np.uint8) for k in LEG}
def segs(d):
    out=[]; cur=[]
    for it in d['items']:
        if it[0]=='l':
            a,b = T(it[1]),T(it[2])
            if cur and abs(cur[-1][0]-a[0])<0.5 and abs(cur[-1][1]-a[1])<0.5: cur.append(b)
            else:
                if len(cur)>1: out.append(cur)
                cur=[a,b]
        elif it[0]=='re':
            r=it[1]; 
            if len(cur)>1: out.append(cur)
            cur=[]; out.append([T(r.tl),T(r.tr),T(r.br),T(r.bl),T(r.tl)])
        elif it[0]=='qu':
            q=it[1]
            if len(cur)>1: out.append(cur)
            cur=[]; out.append([T(q.ul),T(q.ur),T(q.lr),T(q.ll),T(q.ul)])
        elif it[0]=='c':
            a,b = T(it[1]),T(it[4])
            if cur and abs(cur[-1][0]-a[0])<0.5 and abs(cur[-1][1]-a[1])<0.5: cur.append(b)
            else:
                if len(cur)>1: out.append(cur)
                cur=[a,b]
    if len(cur)>1: out.append(cur)
    return out
for d in p.get_drawings():
    sc = d.get('color'); fc = d.get('fill')
    S_ = segs(d)
    if fc is not None:
        fk = tuple(round(x,3) for x in fc)
        polys=[np.array(s,np.int32) for s in S_ if len(s)>=3]
        if fk in col2k and polys:
            cv2.fillPoly(fillmask[col2k[fk]], polys, 255)
        if fk in [(0.0,0.722,0.0),(0.0,1.0,0.0)] and polys:
            cv2.fillPoly(bound, polys, 255)
    if sc is not None and d['type'] in ('s','fs'):
        ck = tuple(round(x,3) for x in sc)
        if ck in [(0.0,0.0,0.0),(0.502,0.502,0.502)] or ck in [(0.0,0.722,0.0),(0.0,1.0,0.0)]:
            for s in S_: cv2.polylines(bound, [np.array(s,np.int32)], False, 255, 2)
        elif ck in col2k:
            for s in S_: cv2.polylines(colmasks[col2k[ck]], [np.array(s,np.int32)], False, 255, 2)
np.savez_compressed('masks.npz', bound=bound, **{'h_'+k:v for k,v in colmasks.items()}, **{'f_'+k:v for k,v in fillmask.items()})
cv2.imwrite('bound.png', bound[::2,::2])
print('ok')
