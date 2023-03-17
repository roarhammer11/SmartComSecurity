#region Imports
import sqlite3
from sqlite3 import Error
import os
#endregion



#region Functions
class Database:
#public functions
    def insertFile(this, metamaskAddress: str, fileData: bytes, fileName: str, hashId: int): #Inserts file to the database
        this.__createTables()
        conn = this.__connectDatabase()
        query = '''INSERT INTO Files(hashId, metamaskAddress, fileName, fileData)
                VALUES(?,?,?,?)'''
        cursor = conn.cursor()
        # hashId = this.__dynamicallyAllocateHashId(metamaskAddress)
        tupleData = (hashId, metamaskAddress, fileName, fileData)
        try:
            cursor.execute(query, tupleData)
            conn.commit()
        except Error as e:
            print(e)
        finally:
            conn.close()

    def getFile(this, hashId:int, metamaskAddress:str): #Saves file to a certain location
        fileData = this.__getFileData(hashId, metamaskAddress)
        fileName = this.__getFileName(hashId, metamaskAddress)
        result = {"file-data": fileData, "file-name" : fileName}
        return result
    
    def renderFiles(this, metamaskAddress:str):
        numberOfFiles = this.__getNumberOfFiles(metamaskAddress)
        renderFiles = {"number-of-files": numberOfFiles}
        for x in range(0,numberOfFiles):
            renderFiles[x] = this.__getFileName(x,metamaskAddress)
        return renderFiles

    #private functions
    def __connectDatabase(this):
        currentPath = os.path.abspath(os.getcwd())
        try:
            os.mkdir(currentPath + r"\database")
        except:
            ...
        databasePath = currentPath + r"\database\files.db"
        try:
            conn = sqlite3.connect(databasePath)
        except Exception as e:
            print(e)
        return conn

    def __createTables(this):
        conn = this.__connectDatabase()
        query = """CREATE TABLE IF NOT EXISTS Files(
                fileId integer PRIMARY KEY AUTOINCREMENT,
                hashId integer NOT NULL,
                metamaskAddress varchar NOT NULL,
                fileName varchar NOT NULL,
                fileData blob NOT NULL
                );"""
        
        try:
            cursor = conn.cursor()
            cursor.execute(query)
        except Error as e:
            print(e)
        finally:
            conn.close()

    # def __getBinaryData(this, filePath):
    #     print(filePath)
    #     try:
    #         with open(filePath, 'rb') as file:
    #             binaryData = file.read()
    #     except Exception as e:
    #         print(e)
    #     return binaryData

    # def __dynamicallyAllocateHashId(this, metamaskAddress: str):
    #     conn = this.__connectDatabase()
    #     cursor = conn.cursor()
    #     try:
    #         cursor.execute("SELECT COUNT(metamaskAddress) FROM Files WHERE metamaskAddress = ?",(metamaskAddress,))
    #         result = cursor.fetchall()
    #         parsedResult = result[0][0]
    #     except Error as e:
    #         print(e)
    #     finally:
    #         conn.close()
    #     return parsedResult    

    def __getFileData(this, hashId: int, metamaskAddress: str):
        conn = this.__connectDatabase()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT fileData FROM Files WHERE metamaskAddress = ? AND hashId = ?",(metamaskAddress, hashId))
            result = cursor.fetchall()
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        finally:
            conn.close()
        return parsedResult

    def __getFileName(this, hashId: int, metamaskAddress: str):
        conn = this.__connectDatabase()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT fileName FROM Files WHERE metamaskAddress = ? AND hashId = ?",(metamaskAddress, hashId))
            result = cursor.fetchall()
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        finally:
            conn.close()
        return parsedResult
    
    def __getNumberOfFiles(this, metamaskAddress: str):
        conn = this.__connectDatabase()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM Files WHERE metamaskAddress = ?",(metamaskAddress))
            result = cursor.fetchall()
        except Error as e:
            print(e)
        finally:
            conn.close()
        return result
        
#endregion