import base64
from package.database import Database
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import uvicorn

app = FastAPI(title="index")
templates = Jinja2Templates(directory="dist/static")
app.mount(
    "/static/icons", StaticFiles(directory="dist/static/icons"), name="staticIcons"
)
app.mount(
    "/static/javascript",
    StaticFiles(directory="dist/static/javascript"),
    name="staticJavascript",
)


@app.on_event("startup")
async def startup():
    global db
    db = Database()
    # dbconn.setupdatehook(my_update_hook)


@app.on_event("shutdown")
async def shutdown():
    db.conn.close()


@app.get("/")
def renderIndex(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/dashboard/upload-files")
async def handleUploadFiles(
    metamaskAddress: str = Form(...),
    uploadFile: UploadFile = File(...),
    fileIndex: str = Form(...),
):
    try:
        # chunk = 1024  # 500mb chunk
        # data = b""
        # while(byte := await uploadFile.read(chunk)):
        #     data = data + byte
        # print(multiprocessing.cpu_count())
        # data = await uploadFile.read()
        data = await uploadFile.read()
        db.insertFile(metamaskAddress, data, uploadFile.filename, fileIndex)
    except Exception as e:
        return {"message": f"{e}"}
    finally:
        await uploadFile.close()
        return {"file_name": uploadFile.filename, "metamask_address": metamaskAddress}


@app.post("/dashboard/save-files/")
async def handleSaveFiles(hashId: int = Form(...), metamaskAddress: str = Form(...)):
    data = db.getFile(hashId, metamaskAddress)
    jsonifyData = jsonable_encoder(
        data, custom_encoder={bytes: lambda v: base64.b64encode(v).decode("utf-8")}
    )
    return jsonifyData


@app.post("/dashboard/render-files")
async def handleRenderFiles(metamaskAddress: str = Form(...)):
    renderFiles = db.renderFiles(metamaskAddress)
    return renderFiles


class WatchdogHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        print(event)


class WatchdogThread:
    def __init__(self, target_folder_path):
        self.observer = Observer()
        self.target_folder_path = target_folder_path

    def start(self):
        event_handler = WatchdogHandler()
        self.observer.schedule(event_handler, self.target_folder_path, recursive=True)
        print(f"Starting the folder monitoring for {self.target_folder_path}")
        self.observer.start()

    def stop(self):
        self.observer.stop()
        print(f"Stopping the folder monitoring for {self.target_folder_path}")
        self.observer.join()


target_folder_path = "database/"
watchdog_thread = WatchdogThread(target_folder_path)


@app.on_event("startup")
async def startup_event():
    watchdog_thread.start()


@app.on_event("shutdown")
async def shutdown_event():
    watchdog_thread.stop()


if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=80, log_level="info", reload=True)
