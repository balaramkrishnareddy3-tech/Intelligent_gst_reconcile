from fastapi import APIRouter
from ..db import select, update

router=APIRouter(prefix='/api/notifications',tags=['Notifications'])

@router.get('')
def notifications():
    return {'items':select('notifications', order_by='created_at', descending=True)}

@router.post('/{notification_id}/read')
def mark_read(notification_id:str):
    update('notifications', {'id':notification_id}, {'read':True})
    return {'success':True,'id':notification_id}
