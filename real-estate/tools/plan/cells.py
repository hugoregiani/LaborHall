import numpy as np, cv2, json
M = np.load('masks.npz')
bound = M['bound'].copy()
keys = [k[2:] for k in M.files if k.startswith('f_')]
H,W = bound.shape
cidx = np.zeros((H,W), np.uint8)
for i,k in enumerate(keys):
    cidx[M['f_'+k]>0] = i+1
# edges between different fill indices
e = np.zeros_like(bound)
e[:,1:] |= (cidx[:,1:]!=cidx[:,:-1]).astype(np.uint8)*255
e[1:,:] |= (cidx[1:,:]!=cidx[:-1,:]).astype(np.uint8)*255
e = cv2.dilate(e, np.ones((2,2),np.uint8))
B = (bound>0)|(e>0)
free = (~B).astype(np.uint8)
n, lab, stats, cent = cv2.connectedComponentsWithStats(free, connectivity=4)
np.savez_compressed('cells.npz', lab=lab, cidx=cidx)
json.dump(dict(keys=keys, n=int(n)), open('cells_meta.json','w'))
print(n)
