import pymupdf as fitz, json, collections
import sys
doc = fitz.open(sys.argv[1])  # PDF da planta R008015 (rev. 28/11/2024)
p = doc[0]
def T(x,y): return (y, 842-x)
words = [dict(x0=T(w[0],w[3])[0], y0=T(w[0],w[3])[1], x1=T(w[2],w[1])[0], y1=T(w[2],w[1])[1], t=w[4]) for w in p.get_text('words')]
# fix ordering
for w in words:
    a,b = sorted([w['x0'],w['x1']]); c,d = sorted([w['y0'],w['y1']]); w.update(x0=a,x1=b,y0=c,y1=d)
fills=[]
for d in p.get_drawings():
    if d.get('fill') is None: continue
    pts=[]
    for it in d['items']:
        if it[0]=='l': pts += [it[1], it[2]]
        elif it[0]=='re': r=it[1]; pts += [r.tl, r.tr, r.br, r.bl]
        elif it[0]=='qu': q=it[1]; pts += [q.ul,q.ur,q.lr,q.ll]
        elif it[0]=='c': pts += [it[1], it[4]]
    if not pts: continue
    P=[T(pt.x,pt.y) for pt in pts]
    # dedupe consecutive
    Q=[]
    for q in P:
        if not Q or abs(Q[-1][0]-q[0])>1e-3 or abs(Q[-1][1]-q[1])>1e-3: Q.append((round(q[0],2),round(q[1],2)))
    fills.append(dict(c=[round(v,3) for v in d['fill']], pts=Q, n=len(d['items']), op=d.get('fill_opacity'), sw=d.get('even_odd')))
json.dump(dict(words=words, fills=fills), open('vec.json','w'))
print(len(words), len(fills))
