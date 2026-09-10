from fastapi import APIRouter, HTTPException
from ..db import select, get_one

router = APIRouter(prefix='/api/vendors', tags=['Vendors'])

@router.get('')
def vendors():
    return {'items': select('vendors', order_by='name')}

@router.get('/{vendor_id}')
def vendor(vendor_id: str):
    row = get_one('vendors', {'id': vendor_id})
    if not row: raise HTTPException(404, 'Vendor not found')
    return row

@router.get('/{vendor_id}/history')
def vendor_history(vendor_id: str):
    rows = select('invoices', 'id,invoice_number,invoice_date,status,risk_level,itc_risk_amount', {'vendor_id':vendor_id}, 'invoice_date', True)
    return {'vendor_id':vendor_id, 'items':rows}

@router.get('/{vendor_id}/risk')
def vendor_risk(vendor_id: str):
    v = get_one('vendors', {'id':vendor_id})
    if not v: raise HTTPException(404, 'Vendor not found')
    inv = select('invoices', 'id,itc_risk_amount', {'vendor_id':vendor_id})
    return {**v, 'invoice_count':len(inv), 'itc_at_risk':sum(float(x.get('itc_risk_amount') or 0) for x in inv)}
