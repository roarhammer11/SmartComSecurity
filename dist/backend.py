from package.routes import router, socket
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.websockets import WebSocket, WebSocketDisconnect
import uvicorn
from threading import Thread

app = FastAPI(title="index")
app.mount(
    "/static/icons", StaticFiles(directory="dist/static/icons"), name="staticIcons"
)
app.mount(
    "/static/javascript",
    StaticFiles(directory="dist/static/javascript"),
    name="staticJavascript",
)
app.include_router(router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Add the WebSocket connection to the event listeners
    socket.connected_client = websocket

    try:
        while True:
            # Wait for incoming messages
            data = await socket.connected_client.receive_text()
            # Process the received message
            # ...

    except WebSocketDisconnect:
        # Remove the WebSocket connection from the event listeners
        socket.connected_client = None

if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=80, log_level="info", reload=True)
