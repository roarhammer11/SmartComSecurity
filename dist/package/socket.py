class Socket:
    def __init__(self):
        self.connected_client = None

    async def notify_client(self, data):
        await self.connected_client.send_text(data)
