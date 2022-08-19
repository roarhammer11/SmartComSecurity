import base64
from package.database import Database 
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
import uvicorn

app = FastAPI(title="index")
templates = Jinja2Templates(directory="dist/static")
app.mount("/static/icons", StaticFiles(directory="dist/static/icons"), name="staticIcons")
app.mount("/static/javascript", StaticFiles(directory="dist/static/javascript"), name="staticJavascript")
db = Database()

@app.get("/")
def renderIndex(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/dashboard/upload")
async def handleUpload(metamaskAddress: str = Form(...), uploadFile: UploadFile = File(...)):
    try:
        data = await uploadFile.read()
        db.insertFile(metamaskAddress, data, uploadFile.filename)
    except Exception as e:
        return {"message": f"{e}"}
    finally:
        await uploadFile.close()
    return {"file_name": uploadFile.filename, "metamask_address": metamaskAddress}

@app.post("/dashboard/save")
async def handleSave(hashId: int = Form(...), metamaskAddress: str = Form(...)):
    data = db.getFile(hashId, metamaskAddress)
    jsonifyData = jsonable_encoder(data, custom_encoder={
        bytes: lambda v: base64.b64encode(v).decode('utf-8')})
    return jsonifyData

if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=5000, log_level="info", reload=True)
    

