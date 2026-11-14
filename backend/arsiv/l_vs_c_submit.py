"""Submit the (max 5) Sentinel-1 InSAR jobs on ASF HyP3 used by l_vs_c.py.
Token comes from EARTHDATA_TOKEN (never printed). Job ids are saved to out/c_band/jobs.json."""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import hyp3_sdk
from chain_test import get_token

OUT = pathlib.Path(__file__).parent / "out" / "c_band"
OUT.mkdir(parents=True, exist_ok=True)
PAIRS = [  # (name, track-dir, g1, g2, season)
    ("desc-dry-0422-0504", "113", "S1D_IW_SLC__1SDV_20260422T122516_20260422T122543_002459_0040C4_BA9A", "S1D_IW_SLC__1SDV_20260504T122517_20260504T122544_002634_004664_F415", "dry"),
    ("desc-rain-0609-0621", "113", "S1D_IW_SLC__1SDV_20260609T122519_20260609T122546_003159_0057E7_224D", "S1D_IW_SLC__1SDV_20260621T122520_20260621T122547_003334_005D9D_5D8E", "rain"),
    ("desc-rain-0901-0913", "113", "S1D_IW_SLC__1SDV_20260901T122512_20260901T122542_004384_0081A8_745C", "S1D_IW_SLC__1SDV_20260913T122512_20260913T122543_004559_0087C0_CB1A", "rain"),
    ("asc-dry-0216-0228", "19", "S1C_IW_SLC__1SDV_20260216T004722_20260216T004749_006374_00CD28_B301", "S1C_IW_SLC__1SDV_20260228T004722_20260228T004749_006549_00D344_9AB2", "dry"),
    ("asc-rain-0523-0604", "19", "S1C_IW_SLC__1SDV_20260523T004725_20260523T004752_007774_00FCCE_6168", "S1C_IW_SLC__1SDV_20260604T004726_20260604T004753_007949_01029F_64E6", "rain"),
]
if __name__ == "__main__":
    h = hyp3_sdk.HyP3(token=get_token())
    print("credits before:", h.check_credits())
    if (OUT / "jobs.json").exists():
        sys.exit("jobs.json exists - already submitted")
    rec = []
    have = {j.name: j for j in h.find_jobs()}   # never submit the same name twice
    for name, tr, g1, g2, season in PAIRS:
        if "cdmx-" + name in have:
            job = have["cdmx-" + name]
            rec.append(dict(name=name, nisar_track=tr, season=season, g1=g1, g2=g2, job_id=job.job_id))
            continue
        job = h.submit_insar_job(g1, g2, name="cdmx-" + name, looks="20x4",
                                 include_displacement_maps=True, include_inc_map=False)
        job = job.jobs[0]
        rec.append(dict(name=name, nisar_track=tr, season=season, g1=g1, g2=g2, job_id=job.job_id))
        print(name, job.job_id, job.status_code)
    json.dump(rec, open(OUT / "jobs.json", "w"), indent=1)
    print("credits after:", h.check_credits())
