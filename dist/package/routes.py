from fastapi import APIRouter
from fastapi import UploadFile, File, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
import base64
from package.database import Database
from package.watchdog import WatchdogHandler, WatchdogThread
router = APIRouter()
templates = Jinja2Templates(directory="dist/static")
db = Database()
event_handler = WatchdogHandler(db.conn)
target_folder_path = "database/"
watchdog_thread = WatchdogThread(target_folder_path, db.conn)
watchdog_thread.start()
@router.get("/")
def renderIndex(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/dashboard/upload-files")
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
        return {
            "file_name": uploadFile.filename,
            "metamask_address": metamaskAddress,
        }

@router.post("/dashboard/save-files/")
async def handleSaveFiles(hashId: int = Form(...), metamaskAddress: str = Form(...)
):
    data = db.getFile(hashId, metamaskAddress)
    jsonifyData = jsonable_encoder(
        data, custom_encoder={bytes: lambda v: base64.b64encode(v).decode("utf-8")}
    )
    return jsonifyData

@router.post("/dashboard/render-files")
async def handleRenderFiles(metamaskAddress: str = Form(...)):
    renderFiles = db.renderFiles(metamaskAddress)
    return renderFiles

@router.on_event("shutdown")
async def shutdown_event():
    watchdog_thread.stop()
