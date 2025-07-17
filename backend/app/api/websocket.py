from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.progress_service import progress_manager
from app.auth.jwt_auth import get_current_user_websocket, get_current_user
import json

router = APIRouter()

@router.websocket("/ws/progress")
async def websocket_progress_endpoint(websocket: WebSocket, token: str = None):
    user = None
    try:
        user = await get_current_user_websocket(token)
        if not user:
            await websocket.close(code=4001, reason="Invalid authentication")
            return
        
        await progress_manager.connect(websocket, user.username)
        
        try:
            while True:
                try:
                    message = await websocket.receive_text()
                    
                    if message == "ping":
                        await websocket.send_text("pong")
                        
                except WebSocketDisconnect:
                    break
                    
        except Exception as e:
            print(f"WebSocket error for user {user.username}: {e}")
            
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        if websocket.client_state.CONNECTED:
            await websocket.close(code=1011, reason=f"Internal error")
    finally:
        if user:
            progress_manager.disconnect(websocket, user.username)

@router.get("/progress/{operation_id}")
async def get_operation_progress(
    operation_id: str,
    current_user = Depends(get_current_user)
):
    progress = progress_manager.get_progress(operation_id)
    return {"operation_id": operation_id, "progress": progress}
