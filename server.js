const express = require("express")
const http = require("http")
const QRCode = require("qrcode")

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")

const app = express()

let sock
let lastQR = null

app.get("/", (req, res) => {
  res.send("Servidor WhatsApp rodando 🚀")
})

app.get("/qr", (req, res) => {
  if (lastQR) {
    res.send(`<img src="${lastQR}" />`)
  } else {
    res.send("Gerando QR... atualize em 5s")
  }
})

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update

    if (qr) {
      lastQR = await QRCode.toDataURL(qr)
      console.log("QR GERADO!")
    }

    if (connection === "open") {
      console.log("WhatsApp conectado!")
    }

    if (connection === "close") {
      console.log("Reconectando...")
      startWhatsApp()
    }
  })

  sock.ev.on("creds.update", saveCreds)
}

startWhatsApp()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Servidor rodando")
})      
