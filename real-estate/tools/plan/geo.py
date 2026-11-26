import numpy as np, cv2, json, math, sys
from shapely.geometry import Polygon, MultiPolygon, box
from shapely.ops import unary_union
C = np.load('cells.npz'); lab = C['lab']
S = 4; K = 0.5317  # metros por pt
F, P = 'R008015', 'R007520'
# (site, code, plan label, name, kind, height, cells, manual polygons in pt)
B = lambda *a: a
SPEC = [
 (F,'B01','01','Portaria','b',3.5,[90],[]),
 (F,'B02','02','Guarita 01','b',3,[86],[]),
 (F,'B03','03','SQ Escritório','b',7,[79],[]),
 (F,'B04','04','Edifício Administrativo 01','b',7,[83],[]),
 (F,'B05','05','HCT Galpão','b',9,[124,125,146,147,171,150,148,129,136,164],[]),
 (F,'B06','06','Laboratório Fluidos','b',7,[123,145],[]),
 (F,'B07','07','WP/RDT Galpão','b',8,[162],[]),
 (F,'B08','08','HCT Galpão','b',9,[368,369,433,419],[]),
 (F,'B09','09','Laboratório & Escritório','b',7,[367,372,421,432],[]),
 (F,'B10','10','WP Galpão','b',9,[366,431],[]),
 (F,'B11','11','WP Área Certificação','b',4,[414],[]),
 (F,'B12','12','Sperry Escritório','b',3.5,[159],[]),
 (F,'B13','13','Recinto Blindado','b',4,[154],[]),
 (F,'B14','14','Sperry Galpão Calibração','b',6,[179],[]),
 (F,'B15','15','Sperry Lavador','b',5,[359],[]),
 (F,'B17','17','Sperry Galpão','b',10,[248,358,364,429],[]),
 (F,'B18','18','Galpão Motores','b',9,[495,496,497,498,499,500,501],[]),
 (F,'B19','19','HDBS Galpão','b',9,[523],[]),
 (F,'B20','20','HPS/PE Escritório','b',7,[502,503],[]),
 (F,'B21','21','IEM Galpão','b',9,[505,506,518],[]),
 (F,'B22','22','Almoxarifado Não Inflamáveis','b',11,[492,493],[]),
 (F,'B23','23','ETDI & ETE','b',3,[509],[]),
 (F,'B24','24','CMT Galpão SHOC','b',9,[552],[]),
 (F,'B25','25','CMT Galpão','b',9,[541],[]),
 (F,'B26','26','Galpão Pintura','b',8,[544],[]),
 (F,'B27','27','Galpão Solda','b',8,[545],[]),
 (F,'B28','28','Almoxarifado Inflamáveis','b',8,[547,564],[]),
 (F,'B29','29','CMT Planta Silos','b',14,[549],[]),
 (F,'B30','30','Galpão Resíduo','b',6,[630],[]),
 (F,'B31','31','Lavador','b',6,[631],[]),
 (F,'B33','33','Vestiário','b',4,[531],[]),
 (F,'B34','34','Edifício Administrativo 02','b',14.4,[620,637],[]),
 (F,'B35','35','Edifício Lazer','b',4,[621],[]),
 (F,'B36','36','Guarita 03','b',3,[628],[]),
 (F,'B38','38','SE1 · Subestação Elétrica 01','b',4,[130],[]),
 (F,'B39','39','SE2 · Subestação Elétrica 02','b',4,[426],[]),
 (F,'B40','40','SE3 · Subestação Elétrica 03','b',4,[185],[]),
 (F,'B41','41','SE4 · Subestação Elétrica 04','b',4,[593],[]),
 (F,'B42','T01','T01 · Tenda 10x10 L&T','b',6,[567],[]),
 (F,'B45','T04','T04 · Tenda 10x10 CMT','b',6,[525],[]),
 (F,'B46','T05','T05 · Tenda 06x06 IEM','b',5,[566],[]),
 (F,'B47','T06','T06 · Tenda 10x10 IEM','b',6,[565],[]),
 (F,'B48','T07','T07 · Tenda 10x20 TSS','b',6,[577],[]),
 (F,'B49','T08','T08 · Tenda 10x10 TSS','b',6,[578],[]),
 (F,'B50','T09','T09 · Tenda 10x15 TSS','b',6,[579],[]),
 (F,'B51','T10','T10 · Tenda 10x10 TSS','b',6,[580],[]),
 (F,'B52','T11','T11 · Tenda 10x15 SQ/HPS','b',6,[582,583],[]),
 (F,'B53','T12','T12 · Tenda 10x10 HPS','b',6,[642],[]),
 (F,'B54','T13','T13 · Tenda 10x10 HPS','b',6,[643],[]),
 (F,'B55','T14','T14 · Tenda 10x15 HPS','b',6,[635,636],[]),
 (F,'B56','T15','T15 · Tenda 10x10 HPS','b',6,[646],[]),
 (F,'B57','T16','T16 · Tenda 10x10 HPS','b',6,[644],[]),
 (F,'B58','T17','T17 · Tenda 10x10 HPS','b',6,[645],[]),
 (F,'B59','T18','T18 · Tenda 10x15 HPS','b',6,[638],[]),
 (F,'B60','T19','T19 · Tenda 10x10 HPS','b',6,[647],[]),
 (F,'B61','T20','T20 · Tenda 10x20 PPS','b',6,[601],[]),
 (F,'B62','T21','T21 · Tenda 10x10 HPS','b',6,[640],[]),
 (F,'B63','T22','T22 · Tenda 10x10 L&T','b',6,[554],[]),
 (F,'B64','64','CB01 · Casa de Bomba 01','b',3,[585],[]),
 (F,'B65','65','CB02 · Casa de Bomba 02','b',3,[533],[]),
 (F,'B69','T26','T26 · Tenda 20x10 HPS','b',6,[641],[]),
 (F,'B70','70','HCT New Shop','b',11,[559],[]),
 (F,'B71','71','Lavador','b',5,[343],[]),
 (F,'B72','T27','T27 · Tenda 10x7 WP','b',5,[386],[]),
 (F,'EM01','EM01','EM01 · HPS/Flex Galpão (estrutura móvel)','b',5,[423],[]),
 (F,'EM03','EM03','EM03 · SQ Área de Certificação (estrutura móvel)','b',4,[595],[]),
 (F,'EM04','EM04','EM04 · SQ Área de Certificação (estrutura móvel)','b',4,[574],[]),
 (F,'CT04','CT04','CT04 · Contêiner','b',2.6,[599],[]),
 (F,'CT05','CT05','CT05 · Contêiner','b',2.6,[600],[]),
 (F,'CT06','CT06','CT06 · Contêiner','b',2.6,[594],[]),
 (F,'CT08','CT08','CT08 · Contêiner','b',2.6,[649],[]),
 (P,'B01','T23','T23 · Tenda 40x30 HCT','b',8,[587],[]),
 (P,'B02','T24','T24 · Tenda 40x30 HCT','b',8,[617],[]),
 (P,'B03','T25','T25 · Tenda 20x10 HCT','b',6,[618],[]),
 # pátios R008015
 (F,'L01.L03','BAROID 312,7 m²','Pátio Baroid','y',0,[520],[]),
 (F,'L01.L04','CMT 402,6 m²','Pátio CMT','y',0,[524],[]),
 (F,'L01.L04','CMT 405,5 m²','Pátio CMT','y',0,[556],[]),
 (F,'L01.L04','CMT 45,0 m²','Pátio CMT','y',0,[540],[]),
 (F,'L01.L04','CMT 74,8 m²','Pátio CMT','y',0,[],[[(246,497),(256,505),(263,529),(249,529)]]),
 (F,'L01.L05','HCT 78,1 m²','Pátio HCT','y',0,[187],[]),
 (F,'L01.L05','HCT 206,3 m²','Pátio HCT','y',0,[186],[]),
 (F,'L01.L05','HCT 138,6 m²','Pátio HCT','y',0,[188],[]),
 (F,'L01.L05','HCT 139,6 m²','Pátio HCT','y',0,[180],[]),
 (F,'L01.L05','HCT 25,7 m²','Pátio HCT','y',0,[131],[]),
 (F,'L01.L05','HCT 28,6 m²','Pátio HCT','y',0,[140],[]),
 (F,'L01.L05','HCT 43,2 m²','Pátio HCT','y',0,[160],[]),
 (F,'L01.L05','HCT 163,4 m²','Pátio HCT','y',0,[158],[]),
 (F,'L01.L05','HCT 284,1 m²','Pátio HCT','y',0,[351],[]),
 (F,'L01.L05','HCT 120 m²','Pátio HCT','y',0,[428],[]),
 (F,'L01.L05','HCT 120 m²','Pátio HCT','y',0,[],[[(701,315),(709,315),(709,371),(701,371)]]),
 (F,'L01.L06','HDBS 149 m²','Pátio HDBS','y',0,[529],[]),
 (F,'L01.L06','HDBS 126,6 m²','Pátio HDBS','y',0,[537],[]),
 (F,'L01.L06','HDBS 117,0 m²','Pátio HDBS','y',0,[542],[]),
 (F,'L01.L07','FlexTubo 1.430,0 m²','Pátio HPS · FlexTubo','y',0,[204],[]),
 (F,'L01.L07','FlexTubo 300 m²','Pátio HPS · FlexTubo','y',0,[],[[(584.3,138.5),(640.5,138.5),(640.5,157.6),(584.3,157.6)]]),
 (F,'L01.L07','Flextubo 3.548,6 m²','Pátio HPS · FlexTubo','y',0,[624],[]),
 (F,'L01.L08','IEM 284,9 m²','Pátio IEM','y',0,[543],[]),
 (F,'L01.L08','IEM 121,3 m²','Pátio IEM','y',0,[653],[]),
 (F,'L01.L09','PE 704,1 m²','Pátio PE','y',0,[519],[]),
 (F,'L01.L10','PML 121,5 m²','Pátio L&T (PML)','y',0,[555],[]),
 (F,'L01.L10','PML 540 m²','Pátio L&T (PML)','y',0,[548],[]),
 (F,'L01.L11','SPERRY 2.688,5 m²','Pátio Sperry','y',0,[262],[]),
 (F,'L01.L11','SPERRY 181,7 m²','Pátio Sperry','y',0,[178],[]),
 (F,'L01.L11','SPERRY 297,6 m²','Pátio Sperry','y',0,[521],[]),
 (F,'L01.L12','SQ 114,8 m²','Pátio SQ','y',0,[603],[]),
 (F,'L01.L12','SQ 362,4 m²','Pátio SQ','y',0,[596],[]),
 (F,'L01.L13','TSS 654,8 m²','Pátio TSS','y',0,[522],[]),
 (F,'L01.L13','TSS 98,3 m²','Pátio TSS','y',0,[528],[]),
 (F,'L01.L13','TSS/SWT 4.852,8 m²','Pátio TSS','y',0,[572,573],[]),
 (F,'L01.L13','TSS 51,5 m²','Pátio TSS','y',0,[494],[]),
 (F,'L01.L13','TSS 67 m²','Pátio TSS','y',0,[348],[]),
 (F,'L01.L14','WP 182,0 m²','Pátio WP','y',0,[161],[]),
 (F,'L01.L14','WP 156,3 m²','Pátio WP','y',0,[184],[]),
 (F,'L01.L14','WP 54 m²','Pátio WP','y',0,[102],[]),
 (F,'L01.L14','WP 96 m²','Pátio WP','y',0,[103],[]),
 (F,'L01.L14','WP 167 m²','Pátio WP','y',0,[104],[]),
 (F,'L01.L14','WP 1.087,2 m²','Pátio WP','y',0,[365,342],[]),
 (F,'L01.L14','WP 64,4 m²','Pátio WP','y',0,[345],[]),
 (F,'L01.L17','PPS 945 m²','Pátio PPS','y',0,[558],[]),
 (F,'L01.L17','PPS 811,5 m²','Pátio PPS','y',0,[532],[]),
 (F,'L01.L18','Nitrogênio 267 m²','Pátio HPS · Nitrogênio','y',0,[546],[]),
 (F,'L01.L18','Nitrogênio 400 m²','Pátio HPS · Nitrogênio','y',0,[576],[]),
 (F,'L01.L18','Nitrogênio 1.815 m²','Pátio HPS · Nitrogênio','y',0,[626],[]),
 (F,'L01.L18','NI 43,1 m²','Pátio HPS · Nitrogênio','y',0,[346],[]),
 # pátios R007520 (área alugada)
 (P,'L01.L01','Pool Cestas 2.210 m²','Pátio L&T · Pool de Cestas','y',0,[551],[]),
 (P,'L01.L01','Exportação/Importação 740 m²','Pátio L&T · Exportação/Importação','y',0,[633],[]),
 (P,'L01.L02','HCT 640 m²','Pátio HCT','y',0,[560],[]),
 (P,'L01.L03','HPS 1.300 m²','Pátio HPS · FlexTubo','y',0,[],[[(1085,529),(1156,529),(1175,587),(1085,583)]]),
 (P,'L01.L04','TSS 760 m²','Pátio TSS','y',0,[581],[]),
 (P,'L01.L08','PPS 508,7 m²','Pátio PPS','y',0,[527],[]),
 (P,'L01.L09','BAROID 360 m²','Pátio Baroid','y',0,[604],[]),
 (P,'RES','RES 415 m²','Área RES (funções suporte)','y',0,[586],[]),
]
def cell_poly(c):
    split = None
    if isinstance(c, str): split = c[-1]; c = int(c[:-1])
    m = (lab == c).astype(np.uint8)
    if split == 'L': m[:, int(259.5*S):] = 0
    if split == 'R': m[:, :int(259.5*S)] = 0
    m = cv2.dilate(m, np.ones((5,5), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    ps = []
    for ct in cs:
        if cv2.contourArea(ct) < 40: continue
        ap = cv2.approxPolyDP(ct, 2.2, True)[:,0,:] / S
        if len(ap) >= 3: ps.append(Polygon(ap).buffer(0))
    return ps
items = []
allpolys = []
for site, code, label, name, kind, h, cells, man in SPEC:
    ps = []
    for c in cells: ps += cell_poly(c)
    for m in man: ps.append(Polygon(m))
    u = unary_union([p.buffer(0.6, join_style=2) for p in ps]).buffer(-0.6, join_style=2)
    u = u.simplify(0.35)
    geoms = list(u.geoms) if isinstance(u, MultiPolygon) else [u]
    out = []
    for g in geoms:
        if g.area < 2: continue
        out.append([[round(x,2), round(y,2)] for x, y in list(g.exterior.coords)[:-1]])
        allpolys.append(g)
    a = sum(Polygon(o).area for o in out) * K * K
    # eixo principal (retângulo mínimo)
    mr = u.minimum_rotated_rectangle
    xy = list(mr.exterior.coords)
    e1 = np.subtract(xy[1], xy[0]); e2 = np.subtract(xy[2], xy[1])
    ax = e1 if np.linalg.norm(e1) >= np.linalg.norm(e2) else e2
    ax = ax / (np.linalg.norm(ax) or 1)
    if ax[0] < 0 or (abs(ax[0]) < 1e-6 and ax[1] < 0): ax = -ax
    c = u.centroid
    items.append(dict(site=site, code=code, lbl=label, name=name, kind=kind, h=h, poly=out, ax=[round(float(ax[0]),4), round(float(ax[1]),4)], c=[round(c.x,2), round(c.y,2)], am2=round(a,1)))
# chão: tudo que não é exterior
reg = (lab != 1).astype(np.uint8)
reg[:, int(840*S):int(1191*S)][:int(300*S)] = 0  # legenda
reg[int(600*S):, :] = 0
reg[:int(95*S), :] = 0
reg = cv2.morphologyEx(reg, cv2.MORPH_CLOSE, np.ones((9,9), np.uint8))
n, l2, st, _ = cv2.connectedComponentsWithStats(reg, 4)
big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
gm = (l2 == big).astype(np.uint8)
cs, _ = cv2.findContours(gm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
ct = max(cs, key=cv2.contourArea)
g = Polygon(cv2.approxPolyDP(ct, 4, True)[:,0,:] / S).buffer(0)
g = unary_union([g] + [Polygon(m) for m in [[(1085,529),(1156,529),(1175,587),(1085,583)]]]).buffer(1.5, join_style=2).buffer(-1.5, join_style=2)
g = g.buffer(-3, join_style=2).buffer(3, join_style=2).simplify(0.8)
if isinstance(g, MultiPolygon): g = max(g.geoms, key=lambda q: q.area)
ground = [[round(x,1), round(y,1)] for x, y in list(g.exterior.coords)[:-1]]
bx = g.bounds
import collections
D = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '../../data/data.json'))
last = D['months'][-1]['k']
agg = collections.OrderedDict()
for r in D['rows'][last]:
    o = D['objs'][r[0]]
    site, bld, flr, sp = o[1], o[4], o[5], o[6]
    if site not in ('R007522', 'R010713'): continue
    code = bld + '.' + (flr if bld == 'L01' else sp) if bld in ('L01', 'C01') else bld
    k = (site, code)
    agg.setdefault(k, dict(a=0, psl=collections.Counter()))
    agg[k]['a'] += r[4]; agg[k]['psl'][D['T']['psl'][r[1]]] += r[4]
SCH = {}
for site in ('R007522', 'R010713'):
    ks = [k for k in agg if k[0] == site]
    yards = sorted([k for k in ks if k[1][:3] in ('L01', 'C01')], key=lambda k: -agg[k]['a'])
    blds = sorted([k for k in ks if k not in yards], key=lambda k: k[1])
    out = []; gap = 4.0
    def row(keys, y0, kind, asp):
        x = 0; hmax = 0
        for k in keys:
            a = max(agg[k]['a'], 20)
            w = (a * asp) ** .5; d = a / w
            out.append(dict(site=site, code=k[1], lbl=k[1], name=('Pátio ' if kind == 'y' else 'Edificação ') + k[1] + ' (esquemático)', kind=kind, h=0 if kind == 'y' else 6,
                            pm=[[round(x,2), round(y0,2)], [round(x+w,2), round(y0,2)], [round(x+w,2), round(y0+d,2)], [round(x,2), round(y0+d,2)]]))
            x += w + gap; hmax = max(hmax, d)
        return hmax
    h1 = row(yards, 0, 'y', 1.6)
    row(blds, h1 + 10, 'b', 1.3)
    SCH[site] = out
json.dump(dict(K=K, schem=SCH, ground=ground, bounds=[round(v,1) for v in bx], items=items), open('geo.json','w'), separators=(',',':'), ensure_ascii=False)
print(len(items), 'items; ground pts', len(ground), 'bounds', bx, 'ground m2', round(g.area*K*K))
for it in items:
    if it['kind']=='y': print(it['code'], it['lbl'], it['am2'])
