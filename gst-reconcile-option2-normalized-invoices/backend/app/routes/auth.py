from fastapi import APIRouter, HTTPException
from ..db import get_one
from ..schemas import LoginRequest

router = APIRouter(prefix='/api/auth', tags=['Authentication'])

@router.post('/login')
def login(payload: LoginRequest):
    row = get_one('users', {'email': payload.email, 'password': payload.password}, 'id,email,role,name,company_id')
    if not row:
        raise HTTPException(status_code=401, detail='Invalid email or password')
    return {'authenticated': True, 'user': row, 'token': f"demo-token-{row['id']}"}

@router.post('/logout')
def logout():
    return {'success': True, 'message': 'Logged out'}

@router.get('/me')
def me():
    return {'authenticated': False, 'message': 'Use the login endpoint to establish a demo session.'}
