from fastapi import APIRouter, HTTPException
from ..db import get_one, select

router=APIRouter(prefix='/api/graph',tags=['Knowledge Graph'])

@router.get('/invoice/{invoice_id}')
def invoice_graph(invoice_id:str):
    r=get_one('invoices', {'id':invoice_id})
    if not r: raise HTTPException(404,'Invoice not found')
    company_id='COMP-01'; company=get_one('companies', {'id':company_id})
    company_name=company['name'] if company else company_id
    nodes=[{'id':r['id'],'label':r['invoice_number'],'type':'invoice'},{'id':r['vendor_id'],'label':r['vendor_name'],'type':'vendor'},{'id':r['vendor_gstin'],'label':r['vendor_gstin'],'type':'gstin'},{'id':company_id,'label':company_name,'type':'company'}]
    edges=[{'source':company_id,'target':r['id'],'type':'PURCHASED'},{'source':r['id'],'target':r['vendor_id'],'type':'SUPPLIED_BY'},{'source':r['vendor_id'],'target':r['vendor_gstin'],'type':'HAS_GSTIN'}]
    if r['status']!='MATCHED':
        rid=f"risk-{r['id']}"; nodes.append({'id':rid,'label':r['status'],'type':'risk'}); edges.append({'source':r['id'],'target':rid,'type':'FLAGGED_AS'})
    return {'nodes':nodes,'edges':edges}

@router.get('/vendor/{vendor_id}')
def vendor_graph(vendor_id:str):
    v=get_one('vendors', {'id':vendor_id})
    if not v: raise HTTPException(404,'Vendor not found')
    inv=select('invoices','id,invoice_number,status',{'vendor_id':vendor_id})
    nodes=[{'id':v['id'],'label':v['name'],'type':'vendor'}]+[{'id':r['id'],'label':r['invoice_number'],'type':'invoice','status':r['status']} for r in inv]
    edges=[{'source':v['id'],'target':r['id'],'type':'SUPPLIED'} for r in inv]
    return {'nodes':nodes,'edges':edges}
