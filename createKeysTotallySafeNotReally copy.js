const crypto = require('crypto');

// Generate a 256-bit random AES key
const key = crypto.randomBytes(32).toString('hex');
console.log("AES Key:", key);
