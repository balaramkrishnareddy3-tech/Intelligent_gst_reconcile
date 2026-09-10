from fastapi import APIRouter
from pydantic import BaseModel
from ..db import get_one

router=APIRouter(prefix='/api/chat',tags=['Chatbot'])
class ChatRequest(BaseModel):
    question:str
    invoice_id:str|None=None

@router.post('')
def chat(payload:ChatRequest):
    if payload.invoice_id:
        r=get_one('invoices', {'id':payload.invoice_id})
        if r:
            return {'answer':f"{r['invoice_number']} is {r['status']}. The current ITC risk is ₹{float(r.get('itc_risk_amount') or 0):,.0f}. {r.get('mismatch_explanation') or 'Core fields match.'}",'source':'reconciliation-database'}
    return {'answer':'I can explain invoice mismatches, ITC risk, vendor risk and reconciliation results. Provide an invoice ID for a record-specific explanation.','source':'demo-assistant'}
