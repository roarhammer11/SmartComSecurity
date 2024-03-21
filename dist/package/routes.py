from fastapi import APIRouter
from fastapi import UploadFile, File, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
import base64
from package.database import Database
from package.watchdog import WatchdogThread
from package.socket import Socket
import json
from base64 import b64encode, b64decode
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import asyncio

router = APIRouter()
templates = Jinja2Templates(directory="dist/static")
db = Database()
socket = Socket()
target_folder_path = "database/"
watchdog_thread = WatchdogThread(target_folder_path, db.conn, socket)
watchdog_thread.start()


@router.get("/")
def renderIndex(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.post("/dashboard/upload-files")
async def handleUploadFiles(
    metamaskAddress: str = Form(...),
    uploadFile: UploadFile = File(...),
    fileIndex: str = Form(...),
    saltedHash: str = Form(...),
    randomPreviousBlockHash: str = Form(...),
):
    try:
        data = await uploadFile.read()
        key = bytearray.fromhex(saltedHash[2:])
        # print(key)
        # print(type(key))
        # print(saltedHash[2:])
        # print(bytearray.fromhex(saltedHash[2:]))
        cipher = AES.new(key, AES.MODE_CTR)
        ct_bytes = cipher.encrypt(data)
        nonce = b64encode(cipher.nonce).decode("utf-8")  # put nonce in blockchain
        ct = b64encode(ct_bytes).decode("utf-8")
        print(nonce)
        await socket.notify_client(
            {
                "id": "store_nonce",
                "nonce": nonce,
                "randomPreviousBlockHash": randomPreviousBlockHash,
                "saltedHash": saltedHash,
            }
        )
        # sendNonceToClient(nonce)
        # cipher = AES.new(key, AES.MODE_CTR, nonce=b64decode(nonce))
        # pt = cipher.decrypt(b64decode(ct))
        # print(data == pt)
        db.insertFile(metamaskAddress, ct, uploadFile.filename, fileIndex)
    except Exception as e:
        return {"message": f"{e}"}
    finally:
        await uploadFile.close()
        return {
            "file_name": uploadFile.filename,
            "metamask_address": metamaskAddress,
        }


# def sendNonceToClient(nonce):
#     loop = asyncio.new_event_loop()


@router.post("/dashboard/save-files/")
async def handleSaveFiles(hashId: int = Form(...), metamaskAddress: str = Form(...)):
    data = db.getFile(hashId, metamaskAddress)
    jsonifyData = jsonable_encoder(
        data, custom_encoder={bytes: lambda v: base64.b64encode(v).decode("utf-8")}
    )
    return jsonifyData


@router.post("/dashboard/render-files")
async def handleRenderFiles(metamaskAddress: str = Form(...)):
    renderFiles = db.renderFiles(metamaskAddress)
    return renderFiles


@router.post("/dashboard/file-name")
async def handleFileName(hashId: int = Form(...), metamaskAddress: str = Form(...)):
    return {"file_name": db.getFileName(hashId, metamaskAddress)}


@router.on_event("shutdown")
async def shutdown_event():
    watchdog_thread.stop()
