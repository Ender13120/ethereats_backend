require('dotenv').config(); // Load environment variables from .env file
const CryptoJS = require('crypto-js');

const AES_KEY = process.env.AES_KEY; // Get AES key from environment variables

function encrypt(message) {
    const iv = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex); // Generate a random IV
    const encrypted = CryptoJS.AES.encrypt(message, AES_KEY, { iv: CryptoJS.enc.Hex.parse(iv) });
    return iv + encrypted.ciphertext.toString(CryptoJS.enc.Hex); // Return the IV and the ciphertext
}

const message = "Hello, World!";
const encryptedMessage = encrypt(message);

console.log("Original Message:", message);
console.log("Encrypted Message:", encryptedMessage);
