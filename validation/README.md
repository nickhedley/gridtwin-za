# Validation scripts

## pypsa_crossval_uc.py
Cross-validates the GridTwin ZA heuristic against a real PyPSA network solved by HiGHS.
Covers both LP (storage dispatch) and MIP (unit commitment). Requires: pip install pypsa pandas

## mip_solver.py  
Solve a specific scenario for one representative week using the full PyPSA MIP.
Usage: python3 mip_solver.py --coalDecomMW 14000 --newWindMW 33000 --newPvMW 36500
Requires: pip install pypsa pandas
