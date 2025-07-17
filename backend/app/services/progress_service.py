from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import json
from datetime import datetime

class ProgressManager:
    def __init__(self):
        self.progress_data: Dict[str, dict] = {}
        self.connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.connections:
            if websocket in self.connections[user_id]:
                self.connections[user_id].remove(websocket)
            if not self.connections[user_id]:
                del self.connections[user_id]
    
    async def update_progress(self, operation_id: str, user_id: str, progress_info: dict):
        self.progress_data[operation_id] = {
            **progress_info,
            'timestamp': datetime.now().isoformat()
        }
        
        if user_id in self.connections:
            message = {
                'type': 'progress_update',
                'operation_id': operation_id,
                'data': self.progress_data[operation_id]
            }
            
            disconnected = []
            for websocket in self.connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.append(websocket)
            
            for ws in disconnected:
                self.disconnect(ws, user_id)
    
    async def complete_operation(self, operation_id: str, user_id: str, success: bool = True):
        await self.update_progress(operation_id, user_id, {
            'progress': 100,
            'status': 'completed' if success else 'failed',
            'speed': '0 B/s',
            'eta': '0s'
        })
        
        await asyncio.sleep(5)
        if operation_id in self.progress_data:
            del self.progress_data[operation_id]
    
    def get_progress(self, operation_id: str) -> dict:
        return self.progress_data.get(operation_id, {})

progress_manager = ProgressManager()
