/**
 * @fileoverview A simple blockchain demo that creates a block by finding a nonce such that the SHA256 hash
 * has a configurable number of leading zero bits. The block contains data, nonce, and a timestamp,
 * is stored in JSON format, and can be verified.
 */

const crypto = require("crypto");
const fs = require("fs");

/**
 * Checks if the given SHA256 hash buffer has at least the specified number of leading zero bits.
 *
 * @param {Buffer} hashBuffer - The SHA256 hash as a Buffer.
 * @param {number} zeros - The required number of leading zero bits.
 * @returns {boolean} True if the hash has at least the specified number of leading zero bits.
 */
function hasLeadingZeroBits(hashBuffer, zeros) {
  let count = 0;
  for (let i = 0; i < hashBuffer.length; i++) {
    const byte = hashBuffer[i];
    for (let bit = 7; bit >= 0; bit--) {
      if (((byte >> bit) & 1) === 0) {
        count++;
        if (count >= zeros) return true;
      } else {
        return count >= zeros;
      }
    }
  }
  return count >= zeros;
}

/**
 * Creates a new block for the given data by finding a nonce such that
 * SHA256(data + timestamp + nonce) has at least the specified number of leading zero bits.
 *
 * @param {string} data - The text data for the block.
 * @param {number} startingZeros - The required number of leading zero bits in the resulting hash.
 * @returns {Object} The block object containing the block hash, data, nonce, and timestamp.
 */
function createBlock(data, startingZeros) {
  let nonce = 0,
    hash,
    hashBuffer;
  const timestamp = Date.now();
  while (true) {
    const combined = data + timestamp + nonce;
    hashBuffer = crypto.createHash("sha256").update(combined).digest();
    hash = hashBuffer.toString("hex");
    if (hasLeadingZeroBits(hashBuffer, startingZeros)) {
      console.log(`Found nonce: ${nonce} with hash: ${hash}`);
      break;
    }
    nonce++;
  }
  return { hash, data, nonce, timestamp };
}

/**
 * Verifies a block stored in a JSON file by recalculating the hash using the stored data, timestamp, and nonce,
 * and comparing it to the stored hash.
 *
 * @param {string} filePath - The file path of the JSON file containing the block.
 * @returns {boolean} True if the block is valid; otherwise, false.
 */
function verifyBlock(filePath) {
  try {
    const block = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const { hash, data, nonce, timestamp } = block;
    const computedHash = crypto
      .createHash("sha256")
      .update(data + timestamp + nonce)
      .digest("hex");
    if (computedHash === hash) {
      console.log("Block is valid.");
      return true;
    } else {
      console.log("Block is invalid.");
      return false;
    }
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    return false;
  }
}

const data = "This is a sample block data.";
const startingZeros = 16;

console.log("Creating block...");
const block = createBlock(data, startingZeros);
console.log("Block created:", block);

const filePath = "block.json";
fs.writeFileSync(filePath, JSON.stringify(block, null, 4));
console.log(`Block saved to ${filePath}`);

console.log("Verifying block from file...");
verifyBlock(filePath);
