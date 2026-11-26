import numpy as np, json, re, sys
C = np.load('cells.npz'); lab=C['lab']; cidx=C['cidx']
meta=json.load(open('cells_meta.json')); keys=meta['keys']
S=4
H,W=lab.shape
areas = np.bincount(lab.ravel())
def cell_at(x,y):
    px,py=int(x*S),int(y*S)
    best=None
    for r in range(0,40):
        for dy in range(-r,r+1):
            for dx in (-r,r) if abs(dy)!=r else range(-r,r+1):
                yy,xx=py+dy,px+dx
                if 0<=yy<H and 0<=xx<W and lab[yy,xx]>0: return lab[yy,xx]
    return 0
def info(c):
    ys,xs=np.where(lab==c)
    col=np.bincount(cidx[ys,xs], minlength=len(keys)+1)
    k=col.argmax(); kk='none' if k==0 else keys[k-1]
    return dict(cell=int(c), a=round(len(xs)/S/S,1), bb=[round(xs.min()/S),round(ys.min()/S),round(xs.max()/S),round(ys.max()/S)], col=kk, colpct=round(col.max()/len(xs),2))
if __name__=='__main__':
    L=json.load(open('labels.json'))
    for o in L:
        if o['cx']<215 and o['cy']>460: continue
        if not (re.fullmatch(r'\d{2}|T\d{2}|CT\d{2}|EM\d{2}|C01', o['t']) or re.search(r'\d', o['t'])): continue
        if o['t'] in ('m²',): continue
        c=cell_at(o['cx'],o['cy'])
        if c==0: print(o['t'], 'NONE'); continue
        i=info(c); print(o['t'], o['cx'], o['cy'], i)
