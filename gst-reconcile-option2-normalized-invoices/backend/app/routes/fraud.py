from fastapi import APIRouter, HTTPException
from ..db import get_one, select, insert
from ..schemas import FraudRequest
from ..utils import uid

router=APIRouter(prefix='/api/fraud',tags=['Fraud & Risk'])

@router.post('/analyze')
def analyze(payload:FraudRequest):
    r=get_one('invoices', {'id':payload.invoice_id})
    if not r: raise HTTPException(404,'Invoice not found')
    score=0; reasons=[]
    if r.get('status') in ('MISMATCHED','MISSING'): score+=35; reasons.append('GST reconciliation exception')
    if r.get('risk_level') in ('HIGH','CRITICAL'): score+=40; reasons.append('High compliance risk')
    if abs(float(r.get('itc_risk_amount') or 0))>10000: score+=20; reasons.append('Material ITC exposure')
    if r.get('gst_taxable_value') is not None and abs(float(r['taxable_value'])-float(r['gst_taxable_value']))>1000: score+=15; reasons.append('Taxable value variance')
    score=min(score,100); level='CRITICAL' if score>=80 else 'HIGH' if score>=60 else 'MEDIUM' if score>=30 else 'LOW'
    aid=uid('ALERT')
    insert('fraud_alerts',{'id':aid,'invoice_id':payload.invoice_id,'risk_score':score,'risk_level':level,'reasons':reasons})
    return {'alert_id':aid,'invoice_id':payload.invoice_id,'risk_score':score,'risk_level':level,'reasons':reasons}

@router.get('/alerts')
def alerts():
    return {'items':select('fraud_alerts',order_by='created_at',descending=True)}
