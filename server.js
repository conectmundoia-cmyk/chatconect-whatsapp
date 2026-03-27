const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const QRCode = require("qrcode")

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

let sock
let clients = []

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update

    if (qr) {
      const qrImage = await QRCode.toDataURL(qr)
      broadcast({ type: "qr", data: qrImage })
    }

    if (connection === "open") {
      broadcast({ type: "status", data: "connected" })
    }
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", (msg) => {
    const message = msg.messages[0]
    if (!message.key.fromMe) {
      broadcast({
        type: "message",
        data: message.message?.conversation || "Mensagem recebida"
      })
    }
  })
}

function broadcast(data) {
  clients.forEach(c => c.send(JSON.stringify(data)))
}

wss.on("connection", (ws) => {
  clients.push(ws)
})

startWhatsApp()

server.listen(3000, () => {
  console.log("Servidor rodando")
})
