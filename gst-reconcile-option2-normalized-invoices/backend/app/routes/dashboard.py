from fastapi import APIRouter
from ..db import select

router=APIRouter(prefix='/api/dashboard',tags=['Dashboard'])

@router.get('/summary')
def summary():
    rows=select('invoices')
    total=len(rows); matched=sum(r.get('status')=='MATCHED' for r in rows); mismatch=sum(r.get('status')=='MISMATCHED' for r in rows); missing=sum(r.get('status')=='MISSING' for r in rows); high=sum(r.get('status')=='HIGH_RISK' or r.get('risk_level') in ('HIGH','CRITICAL') for r in rows); risk=sum(float(r.get('itc_risk_amount') or 0) for r in rows)
    return {'total_invoices':total,'matched':matched,'mismatched':mismatch,'missing':missing,'high_risk':high,'itc_at_risk':risk,'match_rate':round(matched/total*100,1) if total else 0}

@router.get('/activity')
def activity():
    return {'items':select('audit_logs',order_by='timestamp',descending=True,limit=20)}
