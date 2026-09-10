from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import APP_NAME, CORS_ORIGINS
from .db import init_db, seed_db
from .routes import auth, invoices, vendors, reconciliation, dashboard, fraud, notifications, graph, gst, chat

app = FastAPI(title=APP_NAME, version='2.0.0', description='Intelligent GST Reconciliation backend using Supabase/PostgreSQL.')
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

@app.on_event('startup')
def startup():
    init_db()
    seed_db()

@app.get('/')
def root():
    return {'status':'success','service':APP_NAME,'database':'supabase/postgresql','docs':'/docs'}

@app.get('/api/health')
def health():
    return {'status':'healthy','database':'supabase/postgresql','mode':'demo'}

for router in [auth.router, invoices.router, vendors.router, reconciliation.router, dashboard.router, fraud.router, notifications.router, graph.router, gst.router, chat.router]:
    app.include_router(router)
